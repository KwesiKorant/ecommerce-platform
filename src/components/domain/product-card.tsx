"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Check, AlertCircle } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    imageUrl: string;
    category?: { id: string; name: string; slug: string };
  };
  onSelect?: () => void;
}

/**
 * Arc-AA Product Card
 * Strict Zero-Translate Desktop Card Stability (banning translateY(-2px)).
 * Hardware-accelerated zero-layout-shift scaleX progress scarcity bar.
 */
export function ProductCard({ product, onSelect }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    const success = addItem({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: product.stock,
    });

    if (success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1200);
    }
  };

  // Stock scarcity percentage calculation for scaleX track (capped at 5 units max benchmark)
  const stockPercentage = Math.min(100, Math.max(0, (product.stock / 5) * 100));

  return (
    <article
      onClick={onSelect}
      className="group relative flex flex-col justify-between rounded-xl sm:rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-2.5 sm:p-4 transition-colors duration-150 hover:border-zinc-400 dark:hover:border-zinc-600 product-card shadow-xs"
    >
      <div>
        <Link
          href={`/products/${product.slug}`}
          prefetch={true}
          className="block focus:outline-none"
        >
          {/* Product Image Thumbnail */}
          <div className="relative aspect-4/3 w-full rounded-lg sm:rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800/60 mb-2 sm:mb-3.5">
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            {/* Category Pill Tag */}
            {product.category && (
              <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-[9px] sm:text-[11px] font-medium text-zinc-700 dark:text-zinc-300 shadow-xs">
                {product.category.name}
              </div>
            )}

            {/* Stock Badge Overlay */}
            <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5">
              {isOutOfStock ? (
                <span className="flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md bg-rose-500/90 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-xs">
                  Sold Out
                </span>
              ) : isLowStock ? (
                <span className="flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-md bg-amber-500/95 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-xs animate-pulse">
                  {product.stock} Left
                </span>
              ) : (
                <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded sm:rounded-md bg-emerald-500/20 backdrop-blur-md text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[9px] sm:text-[10px] font-semibold">
                  In Stock
                </span>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              {product.title}
            </h3>
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 sm:line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>
        </Link>

        {/* Stock Scarcity Zero-Layout-Shift Progress Bar (scaleX) */}
        {isLowStock && (
          <div className="mt-2 sm:mt-3">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-medium mb-1">
              <span className="flex items-center gap-1 truncate mr-1">
                <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                <span className="truncate">Low stock</span>
              </span>
              <span className="font-mono shrink-0">{product.stock} left</span>
            </div>
            <div className="w-full h-1 bg-amber-100 dark:bg-amber-950/60 rounded-full overflow-hidden">
              <div
                className="w-full h-full rounded-full bg-amber-500 origin-left transition-transform duration-500 ease-out"
                style={{ transform: `scaleX(${stockPercentage / 100})` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Price & Action Button Footer */}
      <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-1">
        <div className="flex flex-col">
          <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-zinc-400">Price</span>
          <div className="text-xs sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
            <AnimatedCounter value={product.price} prefix="$" decimals={2} />
          </div>
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          aria-label={`Add ${product.title} to cart`}
          className={`flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium btn-tactile cursor-pointer shadow-xs transition-all ${
            isOutOfStock
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed pointer-events-none"
              : isAdded
              ? "bg-emerald-600 text-white"
              : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Added</span>
            </>
          ) : isOutOfStock ? (
            <span>Sold</span>
          ) : (
            <>
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Add to Cart</span>
              <span className="sm:hidden">Add</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
