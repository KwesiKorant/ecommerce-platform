import React, { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetailView, SerializedProduct } from "@/components/domain/product-detail-view";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const instant = false;

/**
 * Deduplicated database query cache per request lifecycle.
 * Guarantees that generateMetadata and ProductPage share a single
 * execution, eliminating redundant roundtrips to PostgreSQL.
 */
const getProductBySlug = cache(async (slug: string) => {
  return await prisma.product.findFirst({
    where: {
      slug,
      isArchived: false,
      isActive: true,
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
});

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Arcfield",
      description: "The requested equipment item could not be located in our catalog.",
    };
  }

  return {
    title: `${product.title} | Arcfield Precision Retail`,
    description: product.description,
    openGraph: {
      title: `${product.title} | Arcfield`,
      description: product.description,
      images: [
        {
          url: product.imageUrl,
          width: 800,
          height: 600,
          alt: product.title,
        },
      ],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch complementary gear from the same category with lean projection
  const rawRelated = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isArchived: false,
      isActive: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      price: true,
      stock: true,
      imageUrl: true,
      categoryId: true,
      isActive: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
    take: 4,
  });

  const serializedProduct: SerializedProduct = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    stock: product.stock,
    imageUrl: product.imageUrl,
    categoryId: product.categoryId,
    category: product.category,
    isActive: product.isActive,
    isArchived: product.isArchived,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  const serializedRelated: SerializedProduct[] = rawRelated.map((p) => ({
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
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <ProductDetailView
      product={serializedProduct}
      relatedProducts={serializedRelated}
    />
  );
}
