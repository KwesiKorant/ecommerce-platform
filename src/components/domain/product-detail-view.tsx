"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Layers,
  Sparkles,
  Package,
  Cpu,
  Sliders,
  AlertCircle,
  Share2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { ProductCard } from "@/components/domain/product-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useCartStore } from "@/store/use-cart-store";
import { useAuthSession } from "@/hooks/use-auth-session";

export interface SerializedProduct {
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
  createdAt?: string;
  updatedAt?: string;
}

interface ProductDetailViewProps {
  product: SerializedProduct;
  relatedProducts: SerializedProduct[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  const openCheckout = useCartStore((state) => state.openCheckout);
  const { isAdmin } = useAuthSession();

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"specs" | "shipping" | "warranty">("specs");

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const maxAvailable = Math.max(1, product.stock);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.min(Math.max(1, prev + delta), maxAvailable));
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const success = addItem(
      {
        productId: product.id,
        title: product.title,
        slug: product.slug,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
      },
      quantity
    );

    if (success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1400);
    }
  };

  const handleInstantBuy = () => {
    if (isOutOfStock || isAdmin) return;
    addItem(
      {
        productId: product.id,
        title: product.title,
        slug: product.slug,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
      },
      quantity
    );
    openCheckout();
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Stock scarcity meter scaleX (capped at 5 units benchmark)
  const stockPercentage = Math.min(100, Math.max(0, (product.stock / 5) * 100));

  // Category-specific high-fidelity technical specs generator
  const getTechnicalSpecs = () => {
    const slug = product.category?.slug || "";
    if (slug === "audio") {
      return [
        { label: "Transducer Architecture", value: "50mm Planar-Magnetic Neodymium Array" },
        { label: "Frequency Response", value: "10 Hz – 48,000 Hz (Hi-Res Certified)" },
        { label: "Impedance", value: "32 Ω nominal @ 1 kHz" },
        { label: "Sensitivity", value: "102 dB / 1 mW" },
        { label: "Acoustic Chamber", value: "Precision CNC Milled Resonance Dampening" },
        { label: "Cable Interface", value: "Detachable Oxygen-Free Silver-Plated Copper (3.5mm / 6.35mm)" },
      ];
    }
    if (slug === "ergonomics") {
      return [
        { label: "Chassis Material", value: "Aerospace-Grade 6063 Aluminum & Reinforced Polymer" },
        { label: "Weight Rating", value: "Tested & Certified up to 150 kg (330 lbs)" },
        { label: "Adjustment Articulation", value: "4-Way Independent Lumbar & Dynamic Tilt Lock" },
        { label: "Contact Surface", value: "Thermal-Dissipating Breathable Elastomeric Mesh" },
        { label: "Caster Wheelbase", value: "65mm PU Silent-Glide Roller Casters" },
        { label: "Certifications", value: "BIFMA Compliant & Ergonomic Workplace Standard" },
      ];
    }
    if (slug === "accessories" || slug === "lifestyle") {
      return [
        { label: "Primary Material", value: "Matte Anodized Aluminum & Natural Full-Grain Leather" },
        { label: "Surface Coating", value: "Oleophobic & Scratch-Resistant Hydrophobic Coating" },
        { label: "Fastening Hardware", value: "Marine-Grade 316 Stainless Steel Machine Screws" },
        { label: "Thermal Dissipation", value: "Passive Convection Heat Exhaust Airflow Channels" },
        { label: "Environmental Standard", value: "100% Recyclable Packaging & Zero VOC Finishes" },
        { label: "Compatibility", value: "Universal Arcfield Workspace Rail System" },
      ];
    }
    // Default Electronics / Peripherals
    return [
      { label: "Switch Mechanism", value: "Hot-Swappable Factory-Lubricated Linear Mechanical Switches" },
      { label: "Polling Rate", value: "1,000 Hz Ultra-Low Latency (1 ms response)" },
      { label: "Chassis Build", value: "Precision CNC Milled Solid Monoblock Aluminum" },
      { label: "Keycap Profile", value: "Double-Shot PBT Dye-Sublimated Matte Texture" },
      { label: "Connectivity", value: "Braided Detachable USB-C, 2.4GHz Wireless & Bluetooth 5.3" },
      { label: "Battery Endurance", value: "Up to 240 Hours continuous operation (RGB off)" },
    ];
  };

  const specs = getTechnicalSpecs();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 pb-24 md:pb-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <ol className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <li>
              <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                Storefront
              </Link>
            </li>
            <li>/</li>
            {product.category && (
              <>
                <li>
                  <Link
                    href={`/?category=${product.category.slug}`}
                    className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    {product.category.name}
                  </Link>
                </li>
                <li>/</li>
              </>
            )}
            <li className="text-zinc-800 dark:text-zinc-200 truncate max-w-[200px] sm:max-w-md font-semibold">
              {product.title}
            </li>
          </ol>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 btn-tactile cursor-pointer shadow-2xs"
            title="Copy product link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied" : "Share"}</span>
          </button>
        </nav>

        {/* Product Core Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 mb-12 sm:mb-16">
          {/* Left Column: Optical Product Gallery (7 Cols) */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <div className="group relative aspect-4/3 w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Category Pill Tag */}
              {product.category && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs border border-zinc-200/50 dark:border-zinc-700/50">
                  {product.category.name}
                </div>
              )}

              {/* Live Inventory Status Overlay */}
              <div className="absolute top-4 right-4">
                {isOutOfStock ? (
                  <span className="px-3 py-1 rounded-lg bg-rose-500/90 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider shadow-xs">
                    Sold Out
                  </span>
                ) : isLowStock ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/95 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider shadow-xs animate-pulse">
                    Only {product.stock} Units Remaining
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-md text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 text-xs font-semibold shadow-xs">
                    In Stock & Ready to Ship
                  </span>
                )}
              </div>

              {/* Optical Diffused Lighting */}
              <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>

            {/* Micro Feature Badges Under Image */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 text-center">
                <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 dark:text-zinc-400 mx-auto mb-1" />
                <span className="text-[10px] sm:text-[11px] font-medium text-zinc-700 dark:text-zinc-300 block truncate">
                  Precision Milled
                </span>
                <span className="text-[9px] sm:text-[10px] text-zinc-400 font-mono block truncate">Aerospace Spec</span>
              </div>
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 text-center">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 mx-auto mb-1" />
                <span className="text-[10px] sm:text-[11px] font-medium text-zinc-700 dark:text-zinc-300 block truncate">
                  2-Year Warranty
                </span>
                <span className="text-[9px] sm:text-[10px] text-zinc-400 font-mono block truncate">Full Cover</span>
              </div>
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 text-center">
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 mx-auto mb-1" />
                <span className="text-[10px] sm:text-[11px] font-medium text-zinc-700 dark:text-zinc-300 block truncate">
                  Express Dispatch
                </span>
                <span className="text-[9px] sm:text-[10px] text-zinc-400 font-mono block truncate">Ships in 24h</span>
              </div>
            </div>
          </div>

          {/* Right Column: Commercial & Purchase Module (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Product Header & Tagline */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono tracking-widest uppercase text-zinc-400">
                    SKU: {product.slug.slice(0, 14).toUpperCase()}
                  </span>
                  <span>&bull;</span>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    Verified Authentic
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-tight">
                  {product.title}
                </h1>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price & Unit Breakdown */}
              <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block mb-0.5">
                      Price (USD)
                    </span>
                    <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                      <AnimatedCounter value={product.price} prefix="$" decimals={2} />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                      Tax Included
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Free global shipping</span>
                  </div>
                </div>

                {/* Scarcity Progress Bar */}
                {isLowStock && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Low Inventory Alert</span>
                      </span>
                      <span className="font-mono">{product.stock} units left in stock</span>
                    </div>
                    <div className="w-full h-1.5 bg-amber-100 dark:bg-amber-950/60 rounded-full overflow-hidden">
                      <div
                        className="w-full h-full rounded-full bg-amber-500 origin-left transition-transform duration-500 ease-out"
                        style={{ transform: `scaleX(${stockPercentage / 100})` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Stepper & Cart Actions */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-2xs">
                    <button
                      type="button"
                      disabled={quantity <= 1 || isOutOfStock}
                      onClick={() => handleQuantityChange(-1)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-tactile cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="px-4 font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 min-w-[36px] text-center">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      disabled={quantity >= product.stock || isOutOfStock}
                      onClick={() => handleQuantityChange(1)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-tactile cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-bold btn-tactile cursor-pointer shadow-sm transition-all ${
                      isOutOfStock
                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                        : isAdded
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart ({quantity})</span>
                      </>
                    ) : isOutOfStock ? (
                      <span>Sold Out</span>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Instant Checkout / Buy Now */}
                {!isOutOfStock && !isAdmin && (
                  <button
                    type="button"
                    onClick={handleInstantBuy}
                    className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold btn-tactile cursor-pointer shadow-md"
                  >
                    <span>Instant Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {isAdmin && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs">
                    Admin session active. Purchases are restricted for administrative accounts.
                  </div>
                )}
              </div>

              {/* Value Props & Assurances */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>2-Year Full Warranty</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>30-Day Free Returns</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Carbon-Neutral Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information Tabs (Technical Specs, Shipping & Returns, Warranty) */}
        <section className="mb-12 sm:mb-16">
          <div className="border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4 sm:gap-8 mb-6 sm:mb-8 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setActiveTab("specs")}
              className={`pb-3 text-xs sm:text-sm font-semibold relative transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "specs"
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Technical Specifications
              {activeTab === "specs" && (
                <motion.div
                  layoutId="pdp-tab-active"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("shipping")}
              className={`pb-3 text-xs sm:text-sm font-semibold relative transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "shipping"
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Fulfillment & Shipping
              {activeTab === "shipping" && (
                <motion.div
                  layoutId="pdp-tab-active"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("warranty")}
              className={`pb-3 text-xs sm:text-sm font-semibold relative transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "warranty"
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Warranty & Service
              {activeTab === "warranty" && (
                <motion.div
                  layoutId="pdp-tab-active"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100"
                />
              )}
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 shadow-xs">
            {activeTab === "specs" && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                {specs.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/60"
                  >
                    <dt className="text-zinc-400 font-medium">{item.label}</dt>
                    <dd className="font-semibold text-zinc-900 dark:text-zinc-100 text-right">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
                <p>
                  All orders are dispatched from our regional precision logistics facilities within 24 hours of confirmation.
                  Express trackable courier delivery is standard across domestic and international destinations.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-1">
                      Standard Express (2–4 Days)
                    </span>
                    <span>Complimentary on all orders over $150. Flat $12 on sub-tier orders.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-1">
                      Priority Next-Flight (1–2 Days)
                    </span>
                    <span>Direct priority dispatch with carrier delivery signature confirmation.</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "warranty" && (
              <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
                <p>
                  Every Arcfield hardware instrument is protected by our comprehensive 2-Year Limited Manufacturer Warranty,
                  covering any defects in materials, switches, internal acoustics, or structural integrity.
                </p>
                <p>
                  Should you experience any operational anomalies, contact our technical desk with your Order Receipt number
                  for rapid replacement or direct bench repair.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Related Equipment Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Complementary Workspace Gear
                </h2>
              </div>
              <Link
                href="/"
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 btn-tactile"
              >
                <span>Browse Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
