"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { ProductCard } from "@/components/domain/product-card";
import { CartSheet } from "@/components/domain/cart-sheet";
import { CheckoutWizard } from "@/components/domain/checkout-wizard";
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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Optical Hero Banner */}
        <section className="relative rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-linear-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950 p-6 sm:p-10 mb-8 sm:mb-12 shadow-xs overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Arc-AA Certified Institutional Retail</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.15]">
              Precision Equipment. Zero-Compromise Engineering.
            </h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Experience online retail powered by 120 FPS compositor kinematics, server-authoritative
              checkout, and real-time inventory change data capture.
            </p>
          </div>

          {/* Diffused Optical Corner Framing */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/10 dark:bg-emerald-400/5 blur-3xl pointer-events-none" />
          <div className="absolute right-10 top-10 w-48 h-48 rounded-full bg-indigo-500/10 dark:bg-indigo-400/5 blur-2xl pointer-events-none" />
        </section>

        {/* Category Filter Pills & Search Stats */}
        <section className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Catalog Divisions
              </h2>
            </div>
            {productsData?.pagination && (
              <span className="text-xs font-mono text-zinc-400">
                {productsData.pagination.total} product{productsData.pagination.total === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap btn-tactile cursor-pointer border transition-colors ${
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
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap btn-tactile cursor-pointer border transition-colors ${
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

        {/* Product Grid */}
        {isLoading ? (
          // Skeleton Loading Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 p-4 animate-pulse space-y-3"
              >
                <div className="aspect-4/3 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
                  <div className="h-5 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-8 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          // Zero-Data Ghost Wireframe Empty Catalog Search State
          <div className="min-h-[380px] rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 flex flex-col items-center justify-center text-center">
            <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-zinc-900/10 dark:border-zinc-100/10 animate-ping" />
              <PackageSearch className="w-10 h-10 text-zinc-300 dark:text-zinc-700 stroke-1" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Cart Drawer Slideout Sheet */}
      <CartSheet onStartCheckout={() => setIsCheckoutOpen(true)} />

      {/* Kinematic FLIP Checkout Wizard Modal */}
      <CheckoutWizard
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* Institutional Footer */}
      <footer className="mt-16 border-t border-zinc-200/80 dark:border-zinc-800/80 py-8 bg-white dark:bg-zinc-900/60 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">ARCFIELD</span>
            <span>&bull;</span>
            <span>E-Commerce Platform (Arc-AA Standard)</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>120 FPS Compositor Standard</span>
            <span>&bull;</span>
            <span>Supabase Realtime CDC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
