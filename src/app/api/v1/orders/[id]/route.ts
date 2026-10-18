import { NextRequest } from "next/server";
import { Role, OrderStatus, AuditAction } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonResponse, handleApiError, NotFoundError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { requireAuth } from "@/lib/auth-check";
import { cancelOrderAtomic } from "@/lib/transactions";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export async function GET(req: NextRequest, context: RouteContext) {
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
    const { id } = await context.params;

    // Strict Anti-IDOR Clamp: Customer can only query their own order records
    const where: { id: string; userId?: string } = { id };
    if (session.role !== Role.ADMIN) {
      where.userId = session.userId;
    }

    const order = await prisma.order.findFirst({
      where,
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

    if (!order) {
      throw new NotFoundError("Order receipt not found.");
    }

    let parsedAddress: Record<string, unknown> = {};
    try {
      parsedAddress = typeof order.shippingAddress === "string" ? JSON.parse(order.shippingAddress) : order.shippingAddress;
    } catch {
      parsedAddress = { fullName: "Valued Customer", addressLine1: String(order.shippingAddress), city: "", country: "" };
    }

    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
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

    return jsonResponse(
      {
        success: true,
        data: { order: formattedOrder },
      },
      { status: 200, rateLimit }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const rateLimit = checkRateLimit(req, "mutation");
  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        error: "RATE_LIMIT_EXCEEDED",
        message: `Too many mutation requests. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      },
      { status: 429, rateLimit }
    );
  }

  try {
    const session = await requireAuth(req, Role.ADMIN);
    const { id } = await context.params;
    const body = await req.json();
    const { status } = updateOrderStatusSchema.parse(body);

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      throw new NotFoundError("Order not found.");
    }

    if (existingOrder.status === status) {
      return jsonResponse(
        {
          success: true,
          data: {
            order: {
              id: existingOrder.id,
              orderNumber: existingOrder.orderNumber,
              status: existingOrder.status,
            },
          },
          message: "Order status is already up to date.",
        },
        { status: 200, rateLimit }
      );
    }

    // If transitioning to CANCELLED, execute atomic cancellation and inventory restitution
    if (status === OrderStatus.CANCELLED) {
      const { updatedOrder } = await cancelOrderAtomic(id, session.userId, true);
      return jsonResponse(
        {
          success: true,
          data: {
            order: {
              id: updatedOrder.id,
              orderNumber: updatedOrder.orderNumber,
              status: updatedOrder.status,
            },
          },
          message: "Order cancelled and inventory restored.",
        },
        { status: 200, rateLimit }
      );
    }

    // Standard status transition (PENDING, PROCESSING, SHIPPED, DELIVERED)
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status },
      });

      await tx.auditLog.create({
        data: {
          entityType: "ORDER",
          entityId: id,
          action: AuditAction.STATUS_CHANGE,
          details: JSON.stringify({
            orderNumber: existingOrder.orderNumber,
            previousStatus: existingOrder.status,
            newStatus: status,
          }),
          performedBy: session.userId,
        },
      });

      return updated;
    });

    return jsonResponse(
      {
        success: true,
        data: {
          order: {
            id: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            status: updatedOrder.status,
          },
        },
        message: `Order status updated to ${status}.`,
      },
      { status: 200, rateLimit }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const rateLimit = checkRateLimit(req, "mutation");
  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        error: "RATE_LIMIT_EXCEEDED",
        message: `Too many mutation requests. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      },
      { status: 429, rateLimit }
    );
  }

  try {
    const session = await requireAuth(req);
    const { id } = await context.params;

    // Pipelined atomic order cancellation and stock restoration
    const { updatedOrder } = await cancelOrderAtomic(
      id,
      session.userId,
      session.role === Role.ADMIN
    );

    return jsonResponse(
      {
        success: true,
        data: {
          order: {
            id: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            status: updatedOrder.status,
          },
        },
        message: "Order cancelled successfully and inventory restored.",
      },
      { status: 200, rateLimit }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}
