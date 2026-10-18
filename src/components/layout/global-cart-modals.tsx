"use client";

import React from "react";
import { CartSheet } from "@/components/domain/cart-sheet";
import { CheckoutWizard } from "@/components/domain/checkout-wizard";
import { useCartStore } from "@/store/use-cart-store";

/**
 * Universal Global Cart & Checkout Modal Container
 * Mounted at RootLayout to ensure cart drawer and checkout wizard are
 * interactively accessible from any route across the entire application.
 */
export function GlobalCartModals() {
  const isCheckoutOpen = useCartStore((state) => state.isCheckoutOpen);
  const openCheckout = useCartStore((state) => state.openCheckout);
  const closeCheckout = useCartStore((state) => state.closeCheckout);

  return (
    <>
      <CartSheet onStartCheckout={openCheckout} />
      <CheckoutWizard isOpen={isCheckoutOpen} onClose={closeCheckout} />
    </>
  );
}
