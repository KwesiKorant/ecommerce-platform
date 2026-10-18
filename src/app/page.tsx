"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { ProductCard } from "@/components/domain/product-card";
import { ScrollToTopSentinel } from "@/components/ui/scroll-to-top";
import { useProductRealtime } from "@/hooks/use-product-realtime";
import { Sparkles, Layers, SlidersHorizontal, PackageSearch } from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  isActive: boolean;
  isArchived: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export default function StorefrontPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Supabase Realtime CDC for instant out-of-stock badge updates across clients
  useProductRealtime();

  // Fetch Categories
  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/v1/categories");
      const json = await res.json();
      return json.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Fetch Products with multi-word search tokenization & category filter
  const { data: productsData, isLoading } = useQuery<{
    products: Product[];
    pagination: { total: number };
  }>({
    queryKey: ["products", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("limit", "24");

      const res = await fetch(`/api/v1/products?${params.toString()}`);
      const json = await res.json();
      return json.data;
    },
    staleTime: 30 * 1000,
  });

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];

  return (
    <div className="relative min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Zero-Scroll-Listener Sentinel */}
      <ScrollToTopSentinel />

      {/* Header Navigation with Search & Cart */}
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Main Catalog Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 md:pb-12">
        {/* Optical Hero Banner */}
        <section className="relative rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-linear-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950 p-5 sm:p-8 lg:p-10 mb-6 sm:mb-10 shadow-xs overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 text-[11px] sm:text-xs font-medium mb-3 sm:mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Engineered For Precision & Durability</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.2]">
              Precision Equipment. Zero-Compromise Engineering.
            </h1>
            <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm lg:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Carefully curated workspace essentials, tactile mechanical interfaces, and studio audio equipment crafted with uncompromising quality and attention to detail.
            </p>
          </div>

          {/* Diffused Optical Corner Framing strictly bounded to card */}
          <div className="absolute right-0 bottom-0 w-64 h-64 rounded-full bg-emerald-500/10 dark:bg-emerald-400/5 blur-3xl pointer-events-none" />
          <div className="absolute right-8 top-0 w-48 h-48 rounded-full bg-indigo-500/10 dark:bg-indigo-400/5 blur-2xl pointer-events-none" />
        </section>

        {/* Category Filter Pills & Search Stats */}
        <section className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Categories
              </h2>
            </div>
            {productsData?.pagination && (
              <span className="text-xs font-mono text-zinc-400">
                {productsData.pagination.total} product{productsData.pagination.total === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-medium whitespace-nowrap btn-tactile cursor-pointer border transition-colors shrink-0 ${
                selectedCategory === "all"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-xs"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              All Items
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-medium whitespace-nowrap btn-tactile cursor-pointer border transition-colors shrink-0 ${
                  selectedCategory === cat.slug
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-xs"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-70 font-mono">({cat.productCount})</span>
              </button>
            ))}
          </div>
        </section>

        {/* Product Grid: 2 Cols on Mobile & Tablet (<1024px), 4 on Desktop */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl sm:rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 p-2.5 sm:p-4 animate-pulse space-y-2.5 sm:space-y-3"
              >
                <div className="aspect-4/3 w-full rounded-lg sm:rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3.5 sm:h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="pt-2 sm:pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <div className="h-4 sm:h-5 w-12 sm:w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-7 sm:h-8 w-14 sm:w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          // Zero-Data Ghost Wireframe Empty Catalog Search State
          <div className="min-h-[340px] sm:min-h-[380px] rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-zinc-900/10 dark:border-zinc-100/10 animate-ping" />
              <PackageSearch className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-300 dark:text-zinc-700 stroke-1" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              No Matching Products Found
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-5">
              We couldn&apos;t find any items matching &ldquo;{searchQuery}&rdquo; in this category. Try adjusting your
              search keywords or clear active filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold btn-tactile shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Footer with Mobile Bottom Nav Clearance */}
      <footer className="mt-16 border-t border-zinc-200/80 dark:border-zinc-800/80 py-8 pb-24 md:pb-8 bg-white dark:bg-zinc-900/60 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">ARCFIELD</span>
            <span>&bull;</span>
            <span>Precision Workspace Gear & Craft</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Free Shipping Over $150</span>
            <span>&bull;</span>
            <span>2-Year Warranty</span>
            <span>&bull;</span>
            <span>&copy; 2026 Arcfield Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
