"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  MapPin,
  PackageCheck,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { useAuthSession } from "@/hooks/use-auth-session";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export interface CheckoutWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted?: (orderId: string) => void;
}

type WizardStep = 1 | 2 | 3 | 4;

export function CheckoutWizard({ isOpen, onClose, onOrderCompleted }: CheckoutWizardProps) {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const { isAdmin } = useAuthSession();
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  const [step, setStep] = useState<WizardStep>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  // Placed Order Result State
  const [completedOrder, setCompletedOrder] = useState<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    shippingAddress: { fullName: string; city: string; country: string };
  } | null>(null);

  // Shipping Form State
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "Ama Serwaa",
    addressLine1: "14 Independence Avenue",
    addressLine2: "",
    city: "Accra",
    postalCode: "GA-123-4567",
    country: "Ghana",
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Query customer saved addresses
  const { data: savedAddresses = [] } = useQuery<{
    id: string;
    fullName: string;
    addressLine1: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }[]>({
    queryKey: ["saved-addresses-checkout"],
    queryFn: async () => {
      const res = await fetch("/api/v1/addresses");
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: isOpen,
  });

  // Pre-fill with customer default address if available
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      setSelectedAddressId(defaultAddr.id);
      setShippingAddress({
        fullName: defaultAddr.fullName,
        addressLine1: defaultAddr.addressLine1,
        addressLine2: "",
        city: defaultAddr.city,
        postalCode: defaultAddr.postalCode,
        country: defaultAddr.country,
      });
    }
  }, [savedAddresses, selectedAddressId]);

  if (!isOpen) return null;

  const goToStep = (nextStep: WizardStep) => {
    setDirection(nextStep > step ? 1 : -1);
    setErrorMessage("");
    setStep(nextStep);
  };

  const handlePlaceOrder = async () => {
    if (isAdmin) {
      setErrorMessage("Administrative accounts are restricted from placing customer orders. Please sign in with a Customer account.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Server-Authoritative Payload: strictly product IDs, quantities, and shipping details
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        shippingAddress,
      };

      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to place order.");
      }

      // Success: Clear cart and transition to receipt step
      clearCart();
      setCompletedOrder(json.data);
      if (onOrderCompleted) onOrderCompleted(json.data.id);
      goToStep(4);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);

      // Trigger hardware-accelerated shake feedback
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Zero-layout-shift progress scaleX calculation
  const progressPercent = step === 1 ? 0.25 : step === 2 ? 0.5 : step === 3 ? 0.75 : 1.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={step === 4 ? onClose : undefined}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
      />

      {/* Kinematic FLIP Layout Morphing Card */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className={`relative z-10 w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden ${
          isShaking ? "animate-shake" : ""
        }`}
      >
        {/* Zero-Layout-Shift Progress Bar (scaleX) */}
        <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
          <div
            className="w-full h-full bg-emerald-600 dark:bg-emerald-500 origin-left transition-transform duration-500 ease-out"
            style={{ transform: `scaleX(${progressPercent})` }}
          />
        </div>

        {/* Wizard Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Step {step} of 4</span>
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {step === 1 && "Cart Verification"}
              {step === 2 && "Shipping Destination"}
              {step === 3 && "Payment & Review"}
              {step === 4 && "Order Confirmed"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 btn-tactile cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert Display */}
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Directional popLayout Steps Container */}
        <div className="p-4 sm:p-6 relative min-h-[260px] overflow-y-auto flex-1">
          <AnimatePresence mode="popLayout" custom={direction}>
            {/* STEP 1: REVIEW CART */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {item.title}
                        </span>
                        <span className="text-zinc-400 font-mono text-[11px]">Qty: {item.quantity}</span>
                      </div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-sm font-bold">
                  <span>Subtotal</span>
                  <AnimatedCounter value={subtotal} prefix="$" decimals={2} />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold btn-tactile cursor-pointer"
                  >
                    <span>Continue to Shipping</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SHIPPING ADDRESS */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.18 }}
                className="space-y-3.5"
              >
                {savedAddresses.length > 0 && (
                  <div className="space-y-1.5 pb-1">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                      Saved Shipping Addresses
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => {
                              setSelectedAddressId(addr.id);
                              setShippingAddress({
                                fullName: addr.fullName,
                                addressLine1: addr.addressLine1,
                                addressLine2: "",
                                city: addr.city,
                                postalCode: addr.postalCode,
                                country: addr.country,
                              });
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">
                              <span className="truncate">{addr.fullName}</span>
                              {addr.isDefault && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono shrink-0 ml-1">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {addr.addressLine1}, {addr.city}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-zinc-500 font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      value={shippingAddress.fullName}
                      onChange={(e) => {
                        setSelectedAddressId(null);
                        setShippingAddress({ ...shippingAddress, fullName: e.target.value });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-zinc-500 font-medium mb-1">Street Address</label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">City</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-zinc-500 font-medium mb-1">Country</label>
                    <input
                      type="text"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 btn-tactile"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold btn-tactile cursor-pointer"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PAYMENT & SUBMIT */}
            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.18 }}
                className="space-y-4 text-xs"
              >
                {/* Delivery Summary */}
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">Delivery Address</span>
                    <p className="text-zinc-500 mt-0.5">
                      {shippingAddress.fullName}, {shippingAddress.addressLine1}, {shippingAddress.city},{" "}
                      {shippingAddress.country}
                    </p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      Credit / Debit Card (•••• 4242)
                    </span>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>

                {isAdmin ? (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      Administrative accounts cannot place purchase orders. Please sign in with a Customer account.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      256-Bit SSL Encrypted Checkout. Your transaction is verified and processed securely.
                    </span>
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center text-sm font-bold">
                  <span>Grand Total</span>
                  <AnimatedCounter value={subtotal} prefix="$" decimals={2} />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => goToStep(2)}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 btn-tactile"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting || isAdmin}
                    onClick={handlePlaceOrder}
                    title={isAdmin ? "Admin accounts cannot checkout" : "Place your order"}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold btn-tactile shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span>Placing Order...</span>
                    ) : (
                      <>
                        <PackageCheck className="w-4 h-4" />
                        <span>Place Order</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: ORDER CONFIRMED RECEIPT */}
            {step === 4 && completedOrder && (
              <motion.div
                key="step-4"
                custom={direction}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="text-center space-y-4 py-2"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Order Confirmed!
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Thank you for your purchase. We have received your order and are preparing it for shipment.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Order Number</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {completedOrder.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Paid</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${completedOrder.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Recipient</span>
                    <span className="text-zinc-800 dark:text-zinc-200">
                      {completedOrder.shippingAddress?.fullName || shippingAddress.fullName}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-tactile"
                  >
                    Continue Shopping
                  </button>
                  <a
                    href="/orders"
                    className="flex-1 py-2 px-3 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold btn-tactile text-center"
                  >
                    View Order History
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
