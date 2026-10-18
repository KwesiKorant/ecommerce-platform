"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, User as UserIcon, Shield, Package } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { useAuthSession } from "@/hooks/use-auth-session";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ThemeToggle } from "@/components/theme-toggle";
import { ExpandingSearchDock } from "@/components/ui/expanding-search-dock";
import { BrandLogo } from "@/components/layout/brand-logo";

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Header({ searchQuery = "", onSearchChange }: HeaderProps) {
  const pathname = usePathname();
  const toggleCart = useCartStore((state) => state.toggleCart);
  const items = useCartStore((state) => state.items);
  const totalItemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const { user } = useAuthSession();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-zinc-950/80 glass-panel transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo (Unboxed open vector mark, text removed) */}
          <div className="flex items-center gap-3 lg:gap-6">
            <Link
              href="/"
              className="flex items-center group btn-tactile shrink-0"
              aria-label="Arcfield Systems Home"
            >
              <BrandLogo className="h-7 sm:h-8 w-auto text-zinc-900 dark:text-zinc-100 group-hover:opacity-80 transition-opacity" />
            </Link>

            {/* Navigation Links (Visible on Tablet & Desktop) */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-md transition-colors btn-tactile ${
                  pathname === "/"
                    ? "text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800"
                    : "hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Catalog
              </Link>
              <Link
                href="/orders"
                className={`px-3 py-1.5 rounded-md transition-colors btn-tactile flex items-center gap-1 ${
                  pathname === "/orders"
                    ? "text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800"
                    : "hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Orders</span>
              </Link>
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-md transition-colors btn-tactile flex items-center gap-1 ${
                    pathname === "/admin"
                      ? "text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800"
                      : "hover:text-zinc-900 dark:hover:text-zinc-100 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right Section: Search, Theme Toggle, Auth, Cart Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {onSearchChange && (
              <ExpandingSearchDock
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Search products... (/ or ⌘K)"
              />
            )}

            <ThemeToggle />

            {/* Auth State: Pure Minimalist Ghost Icon (Desktop/Tablet: md:flex, Mobile: hidden) */}
            {user ? (
              <Link
                href="/account"
                title={`Account: ${user.fullName} (${user.role})`}
                aria-label={`Customer Account: ${user.fullName}`}
                className={`hidden md:flex items-center justify-center w-9 h-9 rounded-full border transition-colors btn-tactile cursor-pointer ${
                  pathname === "/account"
                    ? "border-zinc-400 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs"
                }`}
              >
                {user.role === "ADMIN" ? (
                  <Shield className="w-4 h-4 text-amber-500" />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </Link>
            ) : (
              <Link
                href="/login"
                title="Sign In"
                aria-label="Sign In to Arcfield Systems"
                className="hidden md:flex items-center justify-center w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 btn-tactile transition-colors shadow-xs"
              >
                <UserIcon className="w-4 h-4" />
              </Link>
            )}

            {/* Cart Trigger (Desktop/Tablet: md:flex, Mobile: hidden as bottom nav handles Cart) */}
            <button
              type="button"
              onClick={toggleCart}
              aria-label={`Shopping Cart with ${totalItemCount} items`}
              className="hidden md:flex relative items-center justify-center p-2.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm btn-tactile cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-sm">
                  <AnimatedCounter value={totalItemCount} decimals={0} />
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
  );
}
