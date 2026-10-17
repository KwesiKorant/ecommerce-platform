import { NextRequest } from "next/server";
import { Role, AuditAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonResponse, handleApiError, NotFoundError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { requireAuth } from "@/lib/auth-check";
import { updateProductSchema } from "@/lib/validations/product";
import { softArchiveProductAtomic } from "@/lib/transactions";

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
    const { id } = await context.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!product || (product.isArchived && !req.headers.get("x-admin-request"))) {
      throw new NotFoundError(`Product not found.`);
    }

    return jsonResponse(
      {
        success: true,
        data: {
          product: {
            ...product,
            price: Number(product.price),
          },
        },
      },
      { status: 200, rateLimit }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const rateLimit = checkRateLimit(req, "admin");
  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        error: "RATE_LIMIT_EXCEEDED",
        message: `Too many administrative requests. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      },
      { status: 429, rateLimit }
    );
  }

  try {
    const session = await requireAuth(req, [Role.ADMIN]);
    const { id } = await context.params;

    const body = await req.json();
    const validatedData = updateProductSchema.parse(body);

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError(`Product ${id} not found.`);
    }

    // Arc-AA Standard Section 3.3: Field-Level Diff Calculation
    const modifiedFields: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, val] of Object.entries(validatedData)) {
      if (val !== undefined) {
        const existingVal = (existing as Record<string, unknown>)[key];
        const formattedExisting = key === "price" ? Number(existingVal) : existingVal;
        const formattedNew = key === "price" ? Number(val) : val;

        if (formattedExisting !== formattedNew) {
          modifiedFields[key] = { from: formattedExisting, to: formattedNew };
        }
      }
    }

    // Atomic transaction for entity update + audit logging
    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: validatedData,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      if (Object.keys(modifiedFields).length > 0) {
        await tx.auditLog.create({
          data: {
            entityType: "PRODUCT",
            entityId: id,
            action: AuditAction.UPDATE,
            details: JSON.stringify({
              event: "Product updated by administrator",
              modifiedFields,
            }),
            performedBy: session.userId,
          },
        });
      }

      return product;
    });

    return jsonResponse(
      {
        success: true,
        data: {
          product: {
            ...updated,
            price: Number(updated.price),
          },
        },
        message: "Product updated successfully.",
      },
      { status: 200, rateLimit }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const rateLimit = checkRateLimit(req, "admin");
  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        error: "RATE_LIMIT_EXCEEDED",
        message: `Too many administrative requests. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      },
      { status: 429, rateLimit }
    );
  }

  try {
    const session = await requireAuth(req, [Role.ADMIN]);
    const { id } = await context.params;

    const { searchParams } = new URL(req.url);
    const isPermanent = searchParams.get("permanent") === "true";

    if (isPermanent) {
      await prisma.$transaction(async (tx) => {
        await tx.auditLog.create({
          data: {
            entityType: "PRODUCT",
            entityId: id,
            action: AuditAction.ARCHIVE,
            details: JSON.stringify({ event: "Product permanently purged by admin" }),
            performedBy: session.userId,
          },
        });

        await tx.product.delete({ where: { id } });
      });

      return jsonResponse(
        {
          success: true,
          data: null,
          message: "Product permanently purged from catalog.",
        },
        { status: 200, rateLimit }
      );
    }

    // Default: Soft-archival via pipelined atomic tuple transaction
    const { archivedProduct } = await softArchiveProductAtomic(id, session.userId);

    return jsonResponse(
      {
        success: true,
        data: {
          product: {
            ...archivedProduct,
            price: Number(archivedProduct.price),
          },
        },
        message: "Product soft-archived successfully.",
      },
      { status: 200, rateLimit }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}
