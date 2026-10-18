"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { ProductCard } from "@/components/domain/product-card";
import { ScrollToTopSentinel } from "@/components/ui/scroll-to-top";
import { useProductRealtime } from "@/hooks/use-product-realtime";
import { Sparkles, Layers, SlidersHorizontal, PackageSearch, ArrowDown } from "lucide-react";
import { TiltedGridHero } from "@/components/ui/tilted-grid-hero";
import { BrandLogo } from "@/components/layout/brand-logo";

const SHOWCASE_HERO_FALLBACK_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    alt: "Arc Precision Mechanical Keyboard",
  },
  {
    src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    alt: "Acoustic Shield ANC Studio Headphones",
  },
  {
    src: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    alt: "Studio Hi-Fi Reference Desktop Monitors",
  },
  {
    src: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
    alt: "Pro Ergo Wireless Mouse",
  },
  {
    src: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80",
    alt: "MagSafe 3-in-1 Aluminum Charging Stand",
  },
  {
    src: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    alt: "Merino Wool & Vegan Leather Desk Mat",
  },
  {
    src: "https://images.unsplash.com/photo-1589384267710-7a170981ca78?auto=format&fit=crop&w=800&q=80",
    alt: "Kinematic Lumbar Ergonomic Mesh Chair",
  },
  {
    src: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80",
    alt: "Arcfield Studio Desk Setup",
  },
  {
    src: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    alt: "Ultra-Wide 4K Studio Display",
  },
];

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

  // Curate live equipment photography for the 3D cylindrical showcase ribbon
  const showcaseImages = React.useMemo(() => {
    if (products.length > 0) {
      return products.map((p) => ({ src: p.imageUrl, alt: p.title }));
    }
    return SHOWCASE_HERO_FALLBACK_IMAGES;
  }, [products]);

  return (
    <div className="relative min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Zero-Scroll-Listener Sentinel */}
      <ScrollToTopSentinel />

      {/* Header Navigation with Search & Cart */}
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Main Catalog Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 md:pb-12">
        {/* Standalone 3D Cylindrical Curved Gear Showcase Ribbon (Option B) */}
        <section aria-label="Curated Studio Equipment Showcase" className="mb-4 sm:mb-6">
          <TiltedGridHero
            images={showcaseImages}
            speed={4.5}
            tileHeight={76}
            aspectRatio={16 / 9}
            curve={50}
            fade={20}
            gap={6}
            axis={50}
            className="h-[140px] sm:h-[180px] md:h-[220px] lg:h-[260px] w-full rounded-2xl sm:rounded-3xl"
          >
            <div className="absolute top-2.5 left-3 sm:top-3.5 sm:left-4 z-10 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-[10px] sm:text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-800/60 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Featured Equipment
              </span>
            </div>
          </TiltedGridHero>
        </section>

        {/* Editorial Spotlight Hero Banner (Direction C) */}
        <section className="relative rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-linear-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950 p-5 sm:p-8 lg:p-10 mb-6 sm:mb-10 shadow-xs overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 text-[10px] sm:text-xs font-mono font-medium mb-3 sm:mb-4 border border-zinc-200/60 dark:border-zinc-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>ARCFIELD STUDIO SETUP &bull; IN STOCK</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.15]">
              The Desk Setup.
            </h1>
            <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-mono">
              Arcfield Systems // Curated Workspace Gear & Acoustic Tools
            </p>

            {/* Direct Shopper Action & Live Inventory Guarantee */}
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("catalog-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs sm:text-sm font-semibold shadow-xs hover:bg-zinc-800 dark:hover:bg-white btn-tactile cursor-pointer"
              >
                <span>Browse {products.length > 0 ? products.length : 11} Curated Pieces</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Ready to Ship</span>
                <span className="opacity-40">&bull;</span>
                <span>2-Year Direct Warranty</span>
              </div>
            </div>
          </div>

          {/* Stepped Concentric Radial Wavefront (Feathered Corner Emanation, Zero Hard Cuts) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl select-none opacity-70"
            style={{
              contain: "layout style paint",
              maskImage: "radial-gradient(circle at bottom right, black 25%, rgba(0, 0, 0, 0.75) 50%, rgba(0, 0, 0, 0.3) 72%, transparent 88%)",
              WebkitMaskImage: "radial-gradient(circle at bottom right, black 25%, rgba(0, 0, 0, 0.75) 50%, rgba(0, 0, 0, 0.3) 72%, transparent 88%)",
            }}
          >
            {/* Baseline radial tone fanning from bottom-right angle */}
            <div className="absolute inset-0 bg-radial-[at_100%_100%] from-emerald-500/10 via-indigo-500/5 to-transparent" />

            {/* Concentric Tier 5: Outer Ambient Arc (~15-20% reduced visibility) */}
            <div
              className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[620px] sm:w-[860px] h-[620px] sm:h-[860px] rounded-full border border-emerald-500/10 dark:border-emerald-400/8 bg-radial from-emerald-500/4 via-transparent to-transparent pointer-events-none"
              style={{ contain: "layout style paint" }}
            />

            {/* Concentric Tier 4: Diffuse Outer Ring */}
            <div
              className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[460px] sm:w-[640px] h-[460px] sm:h-[640px] rounded-full border border-indigo-500/15 dark:border-indigo-400/12 bg-radial from-indigo-500/7 via-indigo-500/2 to-transparent pointer-events-none"
              style={{ contain: "layout style paint" }}
            />

            {/* Concentric Tier 3: Mid Wave Ring */}
            <div
              className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[320px] sm:w-[440px] h-[320px] sm:h-[440px] rounded-full border border-emerald-500/20 dark:border-emerald-400/16 bg-radial from-emerald-500/10 via-emerald-500/3 to-transparent pointer-events-none"
              style={{ contain: "layout style paint" }}
            />

            {/* Concentric Tier 2: Inner Halo Ring */}
            <div
              className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[200px] sm:w-[280px] h-[200px] sm:h-[280px] rounded-full border border-indigo-500/24 dark:border-indigo-400/20 bg-radial from-indigo-500/14 via-indigo-500/6 to-transparent pointer-events-none"
              style={{ contain: "layout style paint" }}
            />

            {/* Concentric Tier 1: Core Nucleus at Bottom-Right Corner */}
            <div
              className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[100px] sm:w-[130px] h-[100px] sm:h-[130px] rounded-full border border-emerald-500/30 dark:border-emerald-400/25 bg-radial from-emerald-500/20 via-indigo-500/12 to-transparent pointer-events-none"
              style={{ contain: "layout style paint" }}
            />
          </div>
        </section>

        {/* Category Filter Pills & Search Stats */}
        <section id="catalog-section" className="mb-6 sm:mb-8 scroll-mt-20">
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
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center p-1 shrink-0">
              <BrandLogo className="w-full h-full text-white dark:text-zinc-900" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">ARCFIELD SYSTEMS</span>
            <span>&bull;</span>
            <span>Precision Workspace Gear & Craft</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Free Shipping Over $150</span>
            <span>&bull;</span>
            <span>2-Year Warranty</span>
            <span>&bull;</span>
            <span>&copy; 2026 Arcfield Systems.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
