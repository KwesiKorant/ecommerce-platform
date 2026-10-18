import { NextRequest } from "next/server";
import { Prisma, Role, OrderStatus, AuditAction } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import {
  jsonResponse,
  handleApiError,
  BadRequestError,
  InsufficientStockError,
} from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { requireAuth } from "@/lib/auth-check";
import { createOrderSchema } from "@/lib/validations/order";
import { generateOrderNumber } from "@/lib/security";

export async function POST(req: NextRequest) {
  // Gate 1: Sliding-window checkout rate limit (10 req / min per IP)
  const rateLimit = checkRateLimit(req, "checkout");
  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        error: "RATE_LIMIT_EXCEEDED",
        message: `Checkout rate limit reached. Please wait ${rateLimit.retryAfterSeconds} seconds before placing another order.`,
      },
      { status: 429, rateLimit }
    );
  }

  try {
    // Gate 2: Authentication check
    const session = await requireAuth(req);

    // Gate 2b: Administrative Separation of Duties (SoD) enforcement
    if (session.role === Role.ADMIN) {
      return jsonResponse(
        {
          success: false,
          error: "ADMIN_CHECKOUT_PROHIBITED",
          message:
            "Administrative accounts are restricted from placing customer orders. Please sign in with a Customer account to complete purchases.",
        },
        { status: 403, rateLimit }
      );
    }

    // Gate 3: Strict Zod boundary parsing - strips any client-submitted prices
    const body = await req.json();
    const validatedData = createOrderSchema.parse(body);

    // Gate 4: Multi-Table Server-Authoritative Atomic Checkout Transaction
    const order = await prisma.$transaction(async (tx) => {
      const productIds = validatedData.items.map((i) => i.productId);

      // 1. Fetch live products from PostgreSQL with row existence check
      const dbProducts = await tx.product.findMany({
        where: {
          id: { in: productIds },
          isArchived: false,
          isActive: true,
        },
      });

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      let calculatedTotal = new Decimal(0);

      // 2. Validate availability and compute prices strictly from DB
      for (const item of validatedData.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new BadRequestError(`Product item "${item.productId}" is no longer available in catalog.`);
        }

        // AC-5: Insufficient stock check returning HTTP 409 Conflict
        if (product.stock < item.quantity) {
          throw new InsufficientStockError(
            `Insufficient stock for "${product.title}". Requested: ${item.quantity}, Available: ${product.stock}.`
          );
        }

        const itemTotal = product.price.mul(item.quantity);
        calculatedTotal = calculatedTotal.add(itemTotal);
      }

      // 3. Atomically decrement stock count
      for (const item of validatedData.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 4. Create authoritative Order with frozen unitPrice snapshots in OrderItem
      const orderNumber = generateOrderNumber();

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.userId,
          totalAmount: calculatedTotal,
          status: OrderStatus.PROCESSING,
          shippingAddress: JSON.stringify(validatedData.shippingAddress),
          items: {
            create: validatedData.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: productMap.get(item.productId)!.price, // Frozen price snapshot
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      // 5. Append immutable AuditLog transition record
      await tx.auditLog.create({
        data: {
          entityType: "ORDER",
          entityId: createdOrder.id,
          action: AuditAction.CREATE,
          details: JSON.stringify({
            event: "Order successfully placed and inventory decremented",
            orderNumber: createdOrder.orderNumber,
            totalAmount: Number(calculatedTotal),
            itemCount: validatedData.items.length,
          }),
          performedBy: session.userId,
        },
      });

      return createdOrder;
    });

    // Format Decimal fields to numbers for JSON delivery
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      shippingAddress: JSON.parse(order.shippingAddress),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        product: item.product,
      })),
      createdAt: order.createdAt,
    };

    return jsonResponse(
      {
        success: true,
        data: formattedOrder,
        message: "Order placed successfully.",
      },
      { status: 201, rateLimit }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}

export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, "read");
  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        error: "RATE_LIMIT_EXCEEDED",
        message: `Too many requests. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      },
      { status: 429, rateLimit }
    );
  }

  try {
    const session = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const viewAll = searchParams.get("all") === "true";
    const statusParam = searchParams.get("status");

    // Anti-IDOR: Non-admin users are strictly clamped to their own userId
    const where: Prisma.OrderWhereInput = {};
    if (session.role === Role.ADMIN && viewAll) {
      // Admin viewing all orders
    } else {
      where.userId = session.userId;
    }

    if (statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus)) {
      where.status = statusParam as OrderStatus;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    const formattedOrders = orders.map((order) => {
      let parsedAddress: Record<string, unknown> = {};
      try {
        parsedAddress = typeof order.shippingAddress === "string" ? JSON.parse(order.shippingAddress) : order.shippingAddress;
      } catch {
        parsedAddress = { fullName: "Valued Customer", addressLine1: String(order.shippingAddress), city: "", country: "" };
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        user: order.user,
        totalAmount: Number(order.totalAmount),
        status: order.status,
        shippingAddress: parsedAddress,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          product: item.product,
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    return jsonResponse(
      {
        success: true,
        data: { orders: formattedOrders },
      },
      { status: 200, rateLimit }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}
