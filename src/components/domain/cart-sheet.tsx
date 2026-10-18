"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldAlert } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { useMobileSheetDrag } from "@/hooks/use-mobile-sheet-drag";
import { useAuthSession } from "@/hooks/use-auth-session";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { HoldToConfirmButton } from "@/components/ui/hold-to-confirm-button";

interface CartSheetProps {
  onStartCheckout: () => void;
}

export function CartSheet({ onStartCheckout }: CartSheetProps) {
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const { isAdmin } = useAuthSession();

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalItemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  // Mobile bottom-sheet touch mechanics (scoped strictly to top drag notch & header area)
  const { isMobile, dragProps, dragHandleProps } = useMobileSheetDrag({
    onDismiss: closeCart,
  });

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop with kinematic fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Drawer / Bottom Sheet Container */}
          <div
            className={`fixed ${
              isMobile ? "inset-x-0 bottom-0 z-50" : "inset-y-0 right-0 max-w-full flex pl-10 sm:pl-16 z-50"
            }`}
          >
            <motion.div
              {...dragProps}
              initial={isMobile ? { y: "100%" } : { x: "100%" }}
              animate={isMobile ? { y: 0 } : { x: 0 }}
              exit={isMobile ? { y: "100%" } : { x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className={`bg-white dark:bg-zinc-900 shadow-2xl flex flex-col ${
                isMobile
                  ? "w-full rounded-t-3xl max-h-[90vh] border-t border-zinc-200 dark:border-zinc-800"
                  : "w-screen max-w-md h-full border-l border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {/* Exclusive Mobile Drag Zone: Top Drag Notch + Header Area */}
              <div
                {...dragHandleProps}
                className={isMobile ? "cursor-grab active:cursor-grabbing select-none" : ""}
              >
                {/* Mobile Sheet Drag Handle Notch */}
                {isMobile && (
                  <div className="pt-3 pb-1 flex justify-center">
                    <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  </div>
                )}

                {/* Sheet Header */}
                <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      Your Shopping Cart
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                      {totalItemCount}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={closeCart}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label="Close cart drawer"
                    className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 btn-tactile cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sheet Body: Line Items or Empty State (Free scrolling, zero drag collision) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 touch-pan-y">
                {items.length === 0 ? (
                  // Zero-Data Ghost Wireframe Silhouette Empty State
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6">
                    <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                      {/* Geometric ghost tote rings (4-7% opacity) */}
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-zinc-900/10 dark:border-zinc-100/10 animate-spin-slow" />
                      <div className="absolute inset-2 rounded-full border border-zinc-900/10 dark:border-zinc-100/10" />
                      <ShoppingBag className="w-10 h-10 text-zinc-300 dark:text-zinc-700 stroke-1" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                      Your Cart is Empty
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mb-5">
                      Explore our precision-engineered hardware and desk equipment to begin your order.
                    </p>
                    <button
                      type="button"
                      onClick={closeCart}
                      className="px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium btn-tactile shadow-xs"
                    >
                      Explore Catalog
                    </button>
                  </div>
                ) : (
                  items.map((item) => {
                    const isMaxStock = item.quantity >= item.stock;

                    return (
                      <div
                        key={item.productId}
                        className="flex gap-3.5 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-800/40"
                      >
                        {/* Item Image */}
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0">
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                              {item.title}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
                              aria-label={`Remove ${item.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {/* Line Total */}
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              <AnimatedCounter
                                value={item.price * item.quantity}
                                prefix="$"
                                decimals={2}
                              />
                            </span>

                            {/* Quantity Stepper (Clamped to stock) */}
                            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 btn-tactile cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 font-mono text-xs font-medium text-zinc-800 dark:text-zinc-200 min-w-[24px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={isMaxStock}
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                title={isMaxStock ? "Maximum available stock reached" : "Increase quantity"}
                                className={`p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 btn-tactile cursor-pointer ${
                                  isMaxStock ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
                                }`}
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sheet Footer: Totals & Tactile Actions */}
              {items.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Subtotal</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      <AnimatedCounter value={subtotal} prefix="$" decimals={2} />
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Tactile Hold-To-Confirm Clear Cart */}
                    <HoldToConfirmButton
                      onConfirm={clearCart}
                      label="Clear"
                      holdingLabel="Clearing..."
                      holdDurationMs={1200}
                      variant="danger"
                      size="md"
                      className="shrink-0"
                    />

                    {/* Proceed to Checkout Trigger or Admin Restriction */}
                    {isAdmin ? (
                      <div className="flex-1 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] leading-tight flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>Admin account active. Use a customer account to checkout.</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          closeCart();
                          onStartCheckout();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold btn-tactile shadow-sm cursor-pointer"
                      >
                        <span>Proceed to Checkout</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
