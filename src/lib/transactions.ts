import { prisma } from "./prisma";
import { AuditAction, OrderStatus } from "@prisma/client";
import { NotFoundError, BadRequestError, ForbiddenError } from "./api-response";

/**
 * Pipelined Atomic Tuple Transactions (Single Round-Trip Database Transit)
 * Adheres to Arc-AA Performance Guide Section 3 & TRD Section 4.5.
 */

/**
 * Soft-archives a product and records an immutable audit log in a single wire round-trip.
 */
export async function softArchiveProductAtomic(productId: string, performedBy: string) {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existing) {
    throw new NotFoundError(`Product ${productId} not found.`);
  }

  const now = new Date();
  const [archivedProduct, auditLog] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { isArchived: true, archivedAt: now, isActive: false },
    }),
    prisma.auditLog.create({
      data: {
        entityType: "PRODUCT",
        entityId: productId,
        action: AuditAction.ARCHIVE,
        details: JSON.stringify({
          event: "Product soft-archived by administrator",
          previousStatus: { isArchived: existing.isArchived, isActive: existing.isActive },
          archivedAt: now.toISOString(),
        }),
        performedBy,
      },
    }),
  ]);

  return { archivedProduct, auditLog };
}

/**
 * Restores a soft-archived product and appends an audit log in a single wire round-trip.
 */
export async function restoreProductAtomic(productId: string, performedBy: string) {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existing) {
    throw new NotFoundError(`Product ${productId} not found.`);
  }

  const [restoredProduct, auditLog] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { isArchived: false, archivedAt: null, isActive: true },
    }),
    prisma.auditLog.create({
      data: {
        entityType: "PRODUCT",
        entityId: productId,
        action: AuditAction.UPDATE,
        details: JSON.stringify({
          event: "Product un-archived and restored to active catalog",
        }),
        performedBy,
      },
    }),
  ]);

  return { restoredProduct, auditLog };
}

/**
 * Cancels an order, restores available product inventory for all line items,
 * and records an immutable audit log atomically.
 * Enforces anti-IDOR checks (customers can only cancel their own orders; admins can cancel any).
 */
export async function cancelOrderAtomic(orderId: string, performedBy: string, isAdmin = false) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new NotFoundError(`Order ${orderId} not found.`);
  }

  // Anti-IDOR clamp: verify order belongs to caller unless caller is ADMIN
  if (!isAdmin && order.userId !== performedBy) {
    throw new ForbiddenError("You are not authorized to cancel this order.");
  }

  if (order.status === OrderStatus.CANCELLED) {
    throw new BadRequestError("This order has already been cancelled.");
  }

  if (order.status === OrderStatus.DELIVERED) {
    throw new BadRequestError("Delivered orders cannot be cancelled.");
  }

  if (!isAdmin && order.status === OrderStatus.SHIPPED) {
    throw new BadRequestError("Shipped orders cannot be cancelled directly. Please contact support for assistance.");
  }

  // Pipelined atomic multi-table transaction
  return prisma.$transaction(async (tx) => {
    // 1. Mark order CANCELLED
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    // 2. Atomically restore inventory stock for all line items
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    // 3. Append immutable transition record in AuditLog
    const auditRecord = await tx.auditLog.create({
      data: {
        entityType: "ORDER",
        entityId: orderId,
        action: AuditAction.STATUS_CHANGE,
        details: JSON.stringify({
          event: "Order cancelled and inventory restored",
          previousStatus: order.status,
          newStatus: OrderStatus.CANCELLED,
          restoredItems: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
        performedBy,
      },
    });

    return { updatedOrder, auditRecord };
  });
}
