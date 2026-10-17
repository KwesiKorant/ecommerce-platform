import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonResponse, handleApiError, NotFoundError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { requireAuth } from "@/lib/auth-check";
import { cancelOrderAtomic } from "@/lib/transactions";

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
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
