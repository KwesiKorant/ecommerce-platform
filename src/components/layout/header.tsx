"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, User as UserIcon, Shield, Package, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/store/use-cart-store";
import { useAuthSession } from "@/hooks/use-auth-session";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ThemeToggle } from "@/components/theme-toggle";
import { ExpandingSearchDock } from "@/components/ui/expanding-search-dock";

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Header({ searchQuery = "", onSearchChange }: HeaderProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const toggleCart = useCartStore((state) => state.toggleCart);
  const items = useCartStore((state) => state.items);
  const totalItemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const { user } = useAuthSession();

  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    queryClient.setQueryData(["auth_me"], { user: null });
    queryClient.invalidateQueries({ queryKey: ["auth_me"] });
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 glass-panel transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 group btn-tactile shrink-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
              AF
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                ARCFIELD
              </span>
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase -mt-0.5 hidden xs:block">
                Precision Retail
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
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
        <div className="flex items-center gap-2 sm:gap-3">
          {onSearchChange && (
            <ExpandingSearchDock
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search products... (/ or ⌘K)"
            />
          )}

          <ThemeToggle />

          {/* Auth State */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-zinc-200 dark:border-zinc-800">
              <Link
                href="/account"
                title="View Customer Profile & Saved Addresses"
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all btn-tactile cursor-pointer ${
                  pathname === "/account"
                    ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 shadow-xs"
                    : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70"
                }`}
              >
                {/* Semantic Profile Avatar / Icon */}
                <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center text-xs font-semibold tracking-wide shrink-0 shadow-xs">
                  {user.fullName
                    ? user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : <UserIcon className="w-3.5 h-3.5" />}
                </div>

                <div className="hidden sm:flex flex-col text-left leading-tight pr-0.5">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    {user.role}
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors btn-tactile cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-tactile transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}

          {/* Cart Trigger with 120 FPS Tabular Counter Badge */}
          <button
            type="button"
            onClick={toggleCart}
            aria-label={`Shopping Cart with ${totalItemCount} items`}
            className="relative flex items-center justify-center p-2.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm btn-tactile cursor-pointer"
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
