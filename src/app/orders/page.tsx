"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

export default function OrderHistoryPage() {
  const queryClient = useQueryClient();
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title & Breadcrumbs */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2">
            <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-200">Storefront</Link>
            <span>/</span>
            <span className="text-zinc-800 dark:text-zinc-200">Customer Order Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-zinc-700 dark:text-zinc-300" />
            <span>Order History & Receipts</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            All historical purchases are preserved with immutable price snapshots and anti-IDOR isolation.
          </p>
        </div>

        {/* Feedback Alert */}
        {cancelFeedback && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium flex items-center gap-2 shadow-md">
            <AlertCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{cancelFeedback}</span>
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
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
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

                    <div className="flex items-center gap-3">
                      <div className="text-right">
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
