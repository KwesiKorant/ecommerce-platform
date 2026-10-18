"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from "motion/react";
import { LayoutGrid, Package, ShoppingBag, User as UserIcon, Shield } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { useAuthSession } from "@/hooks/use-auth-session";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface DockItemProps {
  mouseX: ReturnType<typeof useMotionValue<number>>;
  href?: string;
  onClick?: () => void;
  isActive: boolean;
  title: string;
  ariaLabel?: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  activeDotColor?: string;
}

function DockItem({
  mouseX,
  href,
  onClick,
  isActive,
  title,
  ariaLabel,
  children,
  badge,
  activeDotColor = "bg-zinc-900 dark:bg-zinc-100",
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  // Calculate distance from pointer/touch to the icon center
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds || val === Infinity) return Infinity;
    return val - bounds.x - bounds.width / 2;
  });

  // macOS proximity magnification: magnify smoothly when cursor or finger is within 80px
  const scaleSync = useTransform(distance, [-80, 0, 80], [1, 1.25, 1]);
  const ySync = useTransform(distance, [-80, 0, 80], [0, -4, 0]);

  // Spring physics for critically damped 60/120 FPS compositor transforms
  const springScale = useSpring(scaleSync, { stiffness: 400, damping: 28 });
  const springY = useSpring(ySync, { stiffness: 400, damping: 28 });

  const content = (
    <motion.div
      ref={ref}
      style={shouldReduceMotion ? {} : { scale: springScale, y: springY }}
      whileTap={{ scale: 0.92 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex flex-col items-center justify-center select-none"
    >
      {/* Floating Tooltip Label (macOS App Title style) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: -6, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-zinc-900/90 text-white dark:bg-zinc-100/90 dark:text-zinc-900 text-[10px] font-medium tracking-tight whitespace-nowrap shadow-md pointer-events-none z-50 backdrop-blur-xs"
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-colors ${
          isActive
            ? "bg-zinc-900/10 dark:bg-white/12 text-zinc-900 dark:text-zinc-100 font-semibold"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50"
        }`}
      >
        {children}
        {badge}
      </div>

      {/* macOS Active Dot Indicator */}
      {isActive && (
        <span
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.25 h-1.25 rounded-full ${activeDotColor} shadow-xs pointer-events-none`}
        />
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link
        href={href}
        prefetch={true}
        aria-label={ariaLabel || title}
        className="relative p-0.5 focus:outline-hidden cursor-pointer"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || title}
      className="relative p-0.5 focus:outline-hidden cursor-pointer"
    >
      {content}
    </button>
  );
}

/**
 * MobileBottomNav
 * Fluid, tactile macOS-style floating dock for mobile & tablet screen sizes (md:hidden).
 * High-performance 120 FPS compositor transforms, spring physics, and proximity magnification.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuthSession();
  const toggleCart = useCartStore((state) => state.toggleCart);
  const items = useCartStore((state) => state.items);
  const totalItemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  // Proximity mouse/touch tracking coordinate
  const mouseX = useMotionValue(Infinity);

  const isCatalog = pathname === "/" || pathname.startsWith("/products");
  const isOrders = pathname === "/orders";
  const isAccount = pathname === "/account" || pathname === "/login";
  const isAdminActive = pathname === "/admin";

  return (
    <div
      className="md:hidden fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-none pb-[env(safe-area-inset-bottom)]"
      style={{ contain: "layout style" }}
    >
      <nav
        aria-label="Mobile Floating Dock"
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        onTouchMove={(e) => {
          if (e.touches[0]) {
            mouseX.set(e.touches[0].clientX);
          }
        }}
        onTouchEnd={() => mouseX.set(Infinity)}
        onTouchCancel={() => mouseX.set(Infinity)}
        className="pointer-events-auto flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 rounded-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)] max-w-[calc(100vw-1.5rem)] transition-shadow"
      >
        {/* 1. Catalog */}
        <DockItem
          mouseX={mouseX}
          href="/"
          title="Catalog"
          isActive={isCatalog}
        >
          <LayoutGrid className="w-5 h-5" />
        </DockItem>

        {/* 2. Orders */}
        <DockItem
          mouseX={mouseX}
          href="/orders"
          title="Orders"
          isActive={isOrders}
        >
          <Package className="w-5 h-5" />
        </DockItem>

        {/* 3. Shopping Cart */}
        <DockItem
          mouseX={mouseX}
          onClick={toggleCart}
          title="Shopping Cart"
          ariaLabel={`Shopping Cart with ${totalItemCount} items`}
          isActive={false}
          badge={
            totalItemCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-xs">
                <AnimatedCounter value={totalItemCount} decimals={0} />
              </span>
            ) : null
          }
        >
          <ShoppingBag className="w-5 h-5" />
        </DockItem>

        {/* 4. Profile / Account */}
        <DockItem
          mouseX={mouseX}
          href={user ? "/account" : "/login"}
          title={user ? "Profile" : "Sign In"}
          isActive={isAccount}
        >
          <UserIcon className="w-5 h-5" />
        </DockItem>

        {/* 5. Admin (Only rendered if admin) */}
        {isAdmin && (
          <DockItem
            mouseX={mouseX}
            href="/admin"
            title="Admin Console"
            isActive={isAdminActive}
            activeDotColor="bg-amber-500"
          >
            <Shield className="w-5 h-5 text-amber-500" />
          </DockItem>
        )}
      </nav>
    </div>
  );
}
