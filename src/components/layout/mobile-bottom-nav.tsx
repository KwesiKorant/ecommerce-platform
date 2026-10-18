"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Package, ShoppingBag, User as UserIcon, Shield } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { useAuthSession } from "@/hooks/use-auth-session";
import { AnimatedCounter } from "@/components/ui/animated-counter";

/**
 * MobileBottomNav
 * Dedicated ergonomic bottom dock for mobile & tablet screen sizes (md:hidden).
 * Provides rapid thumb-reach navigation across Catalog, Orders, Cart, Profile, and Admin.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuthSession();
  const toggleCart = useCartStore((state) => state.toggleCart);
  const items = useCartStore((state) => state.items);
  const totalItemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const isCatalog = pathname === "/" || pathname.startsWith("/products");
  const isOrders = pathname === "/orders";
  const isAccount = pathname === "/account" || pathname === "/login";
  const isAdminActive = pathname === "/admin";

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800/80 px-2 py-1.5 flex items-center justify-around shadow-lg pb-[max(0.375rem,env(safe-area-inset-bottom))]"
    >
      {/* 1. Catalog */}
      <Link
        href="/"
        prefetch={true}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all btn-tactile cursor-pointer ${
          isCatalog
            ? "text-zinc-900 dark:text-zinc-100 font-semibold"
            : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        }`}
      >
        <div className="relative">
          <LayoutGrid className="w-5 h-5" />
          {isCatalog && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-zinc-900 dark:bg-zinc-100" />
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5">Catalog</span>
      </Link>

      {/* 2. Orders */}
      <Link
        href="/orders"
        prefetch={true}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all btn-tactile cursor-pointer ${
          isOrders
            ? "text-zinc-900 dark:text-zinc-100 font-semibold"
            : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        }`}
      >
        <div className="relative">
          <Package className="w-5 h-5" />
          {isOrders && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-zinc-900 dark:bg-zinc-100" />
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5">Orders</span>
      </Link>

      {/* 3. Shopping Cart Drawer Trigger */}
      <button
        type="button"
        onClick={toggleCart}
        aria-label={`Shopping cart with ${totalItemCount} items`}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all btn-tactile cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {totalItemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-xs">
              <AnimatedCounter value={totalItemCount} decimals={0} />
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5">Cart</span>
      </button>

      {/* 4. Profile / Account */}
      <Link
        href={user ? "/account" : "/login"}
        prefetch={true}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all btn-tactile cursor-pointer ${
          isAccount
            ? "text-zinc-900 dark:text-zinc-100 font-semibold"
            : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        }`}
      >
        <div className="relative">
          <UserIcon className="w-5 h-5" />
          {isAccount && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-zinc-900 dark:bg-zinc-100" />
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5">
          {user ? "Profile" : "Sign In"}
        </span>
      </Link>

      {/* 5. Admin (Only rendered if admin) */}
      {isAdmin && (
        <Link
          href="/admin"
          prefetch={true}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all btn-tactile cursor-pointer ${
            isAdminActive
              ? "text-amber-600 dark:text-amber-400 font-semibold"
              : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <div className="relative">
            <Shield className="w-5 h-5" />
            {isAdminActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Admin</span>
        </Link>
      )}
    </nav>
  );
}
