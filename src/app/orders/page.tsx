"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { HoldToConfirmButton } from "@/components/ui/hold-to-confirm-button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowRight,
  ShoppingBag,
  MapPin,
  AlertCircle,
  Search,
  X,
  SlidersHorizontal,
} from "lucide-react";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: {
    id: string;
    title: string;
    slug: string;
    imageUrl: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  createdAt: string;
}

const FILTER_TABS = [
  { id: "ALL", label: "All Orders", icon: Package },
  { id: "PROCESSING", label: "Processing", icon: Clock },
  { id: "SHIPPED", label: "Shipped", icon: Truck },
  { id: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
  { id: "CANCELLED", label: "Cancelled", icon: XCircle },
] as const;

export default function OrderHistoryPage() {
  const queryClient = useQueryClient();
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("PROCESSING");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data, isLoading, error } = useQuery<{ orders: Order[] }>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/v1/orders");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login?next=/orders";
        }
        throw new Error("Failed to fetch order history.");
      }
      const json = await res.json();
      return json.data;
    },
    staleTime: 30 * 1000,
  });

  const cancelMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to cancel order.");
      return json;
    },
    onSuccess: (json) => {
      setCancelFeedback(json.message || "Order cancelled successfully.");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setTimeout(() => setCancelFeedback(null), 3000);
    },
    onError: (err: Error) => {
      setCancelFeedback(err.message);
      setTimeout(() => setCancelFeedback(null), 3000);
    },
  });

  const orders = data?.orders || [];

  // Instantaneous in-memory status count calculations
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: orders.length,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });
    return counts;
  }, [orders]);

  // Zero-latency filtered orders derivation
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== "ALL" && order.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesProduct = order.items.some((i) =>
          (i.product?.title || "").toLowerCase().includes(q)
        );
        const matchesCity = (order.shippingAddress?.city || "").toLowerCase().includes(q);
        const matchesName = (order.shippingAddress?.fullName || "").toLowerCase().includes(q);
        if (!matchesNumber && !matchesProduct && !matchesCity && !matchesName) {
          return false;
        }
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 pb-24 md:pb-12">
        {/* Page Title & Breadcrumbs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2">
            <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-200">Storefront</Link>
            <span>/</span>
            <span className="text-zinc-800 dark:text-zinc-200">Order History</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                <Package className="w-7 h-7 text-zinc-700 dark:text-zinc-300" />
                <span>Order History & Receipts</span>
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Track order shipments, inspect past receipts, and manage active fulfillment.
              </p>
            </div>

            {orders.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs self-start sm:self-auto">
                <span className="text-zinc-400">Total Lifetime:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{orders.length} orders</span>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {cancelFeedback && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium flex items-center gap-2 shadow-md">
            <AlertCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{cancelFeedback}</span>
          </div>
        )}

        {/* Standard Segmented Filter Tabs & Quick Search Bar */}
        {!isLoading && !error && orders.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 sm:p-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
              {/* Segmented Filter Control */}
              <div className="flex items-center gap-1 overflow-x-auto p-1 no-scrollbar w-full sm:w-auto -mx-1 px-1">
                {FILTER_TABS.map((tab) => {
                  const isActive = statusFilter === tab.id;
                  const Icon = tab.icon;
                  const count = statusCounts[tab.id] ?? 0;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors btn-tactile cursor-pointer select-none ${
                        isActive
                          ? "text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="customer-order-tab-pill"
                          transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          className="absolute inset-0 rounded-xl bg-zinc-100 dark:bg-zinc-800 shadow-2xs -z-10"
                        />
                      )}
                      <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                            : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Order Search Dock */}
              <div className="relative sm:w-64 px-1">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order # or item..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders Listing */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 p-6 animate-pulse space-y-4"
              >
                <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-16 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800/40" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-100">Unable to load orders</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Please ensure you are signed in.</p>
            <Link
              href="/login?next=/orders"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold btn-tactile"
            >
              Sign In
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 stroke-1" />
            </div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">No Orders Yet</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto mb-5">
              You haven&apos;t placed any orders with this account. Browse our catalog to find hardware equipment.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold btn-tactile shadow-xs"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          // Contextual Empty State when filtered results are zero
          <div className="p-10 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center bg-white/40 dark:bg-zinc-900/20">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
              <SlidersHorizontal className="w-5 h-5 stroke-1" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No Orders Found in This View
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto mb-4">
              {searchQuery
                ? `No orders match the keyword "${searchQuery}" with filter "${statusFilter}".`
                : statusFilter === "PROCESSING"
                ? "No active orders in preparation. All your orders have dispatched or completed."
                : statusFilter === "SHIPPED"
                ? "No packages currently in transit."
                : statusFilter === "DELIVERED"
                ? "No orders marked as delivered yet."
                : "No orders match the current status filter."}
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 btn-tactile cursor-pointer"
            >
              <span>Reset Order Filters</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              // Status Pill styling
              let statusPillClass = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
              let StatusIcon = Clock;

              if (order.status === "PROCESSING") {
                statusPillClass = "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300/40";
                StatusIcon = Clock;
              } else if (order.status === "SHIPPED") {
                statusPillClass = "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300/40";
                StatusIcon = Truck;
              } else if (order.status === "DELIVERED") {
                statusPillClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40";
                StatusIcon = CheckCircle2;
              } else if (order.status === "CANCELLED") {
                statusPillClass = "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/40";
                StatusIcon = XCircle;
              }

              const canCancel = order.status === "PROCESSING" || order.status === "PENDING";

              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 sm:p-6 shadow-xs"
                >
                  {/* Order Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs uppercase font-bold text-zinc-900 dark:text-zinc-100">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusPillClass}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{order.status}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Placed on {formattedDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/60">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">
                          Total Paid
                        </span>
                        <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          <AnimatedCounter value={order.totalAmount} prefix="$" decimals={2} />
                        </div>
                      </div>

                      {/* Tactile Hold-To-Confirm Order Cancellation */}
                      {canCancel && (
                        <HoldToConfirmButton
                          label="Cancel Order"
                          holdingLabel="Cancelling..."
                          holdDurationMs={1200}
                          variant="danger"
                          size="sm"
                          onConfirm={() => cancelMutation.mutate(order.id)}
                          disabled={cancelMutation.isPending}
                        />
                      )}
                    </div>
                  </div>

                  {/* Order Line Items */}
                  <div className="py-4 space-y-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                      Ordered Line Items ({order.items.length})
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 text-xs"
                        >
                          {item.product?.imageUrl && (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0">
                              <Image
                                src={item.product.imageUrl}
                                alt={item.product.title}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">
                              {item.product?.title || "Product item"}
                            </span>
                            <div className="flex items-center justify-between text-zinc-500 mt-0.5">
                              <span className="font-mono text-[11px]">Qty: {item.quantity}</span>
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                ${(item.unitPrice * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address Footer */}
                  {order.shippingAddress && (
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-start gap-2 text-xs text-zinc-500">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                      <span>
                        Shipped to: {order.shippingAddress.fullName}, {order.shippingAddress.addressLine1},{" "}
                        {order.shippingAddress.city}, {order.shippingAddress.country}
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
