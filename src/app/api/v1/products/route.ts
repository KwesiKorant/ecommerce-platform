import { NextRequest } from "next/server";
import { Prisma, Role, AuditAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonResponse, handleApiError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { requireAuth } from "@/lib/auth-check";
import { createProductSchema } from "@/lib/validations/product";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  // Gate 1: Rate limit (60 req / min)
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
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category")?.trim();
    const inStockOnly = searchParams.get("inStockOnly") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const sort = searchParams.get("sort") || "newest";
    const includeArchived = searchParams.get("includeArchived") === "true";

    // Build Prisma where filter
    const where: Prisma.ProductWhereInput = {};

    // Standard catalog filters out archived and inactive products
    if (!includeArchived) {
      where.isArchived = false;
      where.isActive = true;
    }

    // Category filter by ID or slug
    if (category && category !== "all") {
      where.category = {
        OR: [{ id: category }, { slug: category }],
      };
    }

    // In-stock availability filter
    if (inStockOnly) {
      where.stock = { gt: 0 };
    }

    // Arc-AA Multi-Word Search Tokenization (AND logic across tokens)
    if (search) {
      const tokens = search.split(/\s+/).filter(Boolean);
      where.AND = tokens.map((token) => ({
        OR: [
          { title: { contains: token, mode: "insensitive" } },
          { description: { contains: token, mode: "insensitive" } },
          { slug: { contains: token, mode: "insensitive" } },
        ],
      }));
    }

    // Sorting definition
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    if (sort === "price_desc") orderBy = { price: "desc" };
    if (sort === "stock_desc") orderBy = { stock: "desc" };
    if (sort === "title_asc") orderBy = { title: "asc" };

    const skip = (page - 1) * limit;

    // Bounded Promise Parallelism (Max 1 round-trip)
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
    ]);

    const formattedProducts = products.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      stock: p.stock,
      imageUrl: p.imageUrl,
      categoryId: p.categoryId,
      category: p.category,
      isActive: p.isActive,
      isArchived: p.isArchived,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return jsonResponse(
      {
        success: true,
        data: {
          products: formattedProducts,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
            hasMore: page * limit < total,
          },
        },
      },
      { status: 200, rateLimit }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}

export async function POST(req: NextRequest) {
  // Gate 1: Rate limit (admin: 20 req / min)
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
    // Gate 2: RBAC authorization check (Strictly ADMIN)
    const session = await requireAuth(req, [Role.ADMIN]);

    // Gate 3: Strict Zod payload validation
    const body = await req.json();
    const validatedData = createProductSchema.parse(body);

    // Compute or sanitize unique slug
    let finalSlug = validatedData.slug || slugify(validatedData.title);
    const existingSlug = await prisma.product.findUnique({ where: { slug: finalSlug } });
    if (existingSlug) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
    }

    // Atomic transaction: create product + append immutable AuditLog
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          title: validatedData.title,
          slug: finalSlug,
          description: validatedData.description,
          price: validatedData.price,
          stock: validatedData.stock,
          imageUrl: validatedData.imageUrl,
          categoryId: validatedData.categoryId,
          isActive: validatedData.isActive ?? true,
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: "PRODUCT",
          entityId: created.id,
          action: AuditAction.CREATE,
          details: JSON.stringify({
            event: "Product created by administrator",
            title: created.title,
            price: Number(created.price),
            stock: created.stock,
          }),
          performedBy: session.userId,
        },
      });

      return created;
    });

    return jsonResponse(
      {
        success: true,
        data: {
          product: {
            ...product,
            price: Number(product.price),
          },
        },
        message: "Product created successfully.",
      },
      { status: 201, rateLimit }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}
