"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { HoldToConfirmButton } from "@/components/ui/hold-to-confirm-button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Shield,
  Plus,
  Package,
  AlertTriangle,
  Archive,
  Trash2,
  CheckCircle2,
  TrendingUp,
  ShoppingBag,
  History,
  Truck,
  Clock,
  XCircle,
  MapPin,
  Calendar,
  User as UserIcon,
  Filter,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  categoryId: string;
  category?: { id: string; name: string };
  isActive: boolean;
  isArchived: boolean;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

interface OrderUser {
  id: string;
  email: string;
  fullName: string;
}

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

interface AdminOrder {
  id: string;
  orderNumber: string;
  userId: string;
  user?: OrderUser;
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
  updatedAt: string;
}

interface AuditRecord {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  details: Record<string, unknown>;
  performedBy: string;
  timestamp: string;
}

type AdminTab = "products" | "orders" | "audit";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>("products");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Product Form State
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");

  // Orders Tab Filter State
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");

  // Audit Tab Filter State
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>("ALL");

  // 1. Fetch Categories
  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/v1/categories");
      const json = await res.json();
      return json.data;
    },
  });

  // 2. Fetch Catalog Products (Admin view with archived)
  const { data: productsData, isLoading: isProductsLoading } = useQuery<{ products: Product[] }>({
    queryKey: ["admin_products"],
    queryFn: async () => {
      const res = await fetch("/api/v1/products?limit=50&includeArchived=true");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/login?next=/admin";
        }
        throw new Error("Administrative permission required.");
      }
      const json = await res.json();
      return json.data;
    },
  });

  // 3. Fetch Customer Orders (Active on "orders" tab)
  const { data: ordersData, isLoading: isOrdersLoading } = useQuery<{ orders: AdminOrder[] }>({
    queryKey: ["admin_orders", orderStatusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ all: "true" });
      if (orderStatusFilter !== "ALL") params.set("status", orderStatusFilter);
      const res = await fetch(`/api/v1/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load customer orders.");
      const json = await res.json();
      return json.data;
    },
    enabled: activeTab === "orders",
  });

  // 4. Fetch Audit Records (Active on "audit" tab)
  const { data: auditData, isLoading: isAuditLoading } = useQuery<{ logs: AuditRecord[] }>({
    queryKey: ["admin_audit_logs", auditTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (auditTypeFilter !== "ALL") params.set("entityType", auditTypeFilter);
      const res = await fetch(`/api/v1/admin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load audit records.");
      const json = await res.json();
      return json.data;
    },
    enabled: activeTab === "audit",
  });

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];
  const orders = ordersData?.orders || [];
  const auditLogs = auditData?.logs || [];

  // Keystroke-Level Monetary Input Hardening
  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
    if (e.key === "." && (e.currentTarget.value.includes(".") || !e.currentTarget.value)) {
      e.preventDefault();
    }
  };

  const handlePriceChange = (rawVal: string, setter: (val: string) => void) => {
    let cleanVal = rawVal.replace(/[^0-9.]/g, "");
    const parts = cleanVal.split(".");
    if (parts.length > 2) cleanVal = `${parts[0]}.${parts.slice(1).join("")}`;
    if (parts.length === 2 && parts[1].length > 2) {
      cleanVal = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    const num = parseFloat(cleanVal);
    if (!isNaN(num) && num > 999999.99) cleanVal = "999999.99";
    setter(cleanVal);
  };

  const handleStockKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
  };

  // Create Product Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: newTitle,
        description: newDescription,
        price: parseFloat(newPrice),
        stock: parseInt(newStock, 10),
        categoryId: newCategory || categories[0]?.id,
        imageUrl: newImageUrl || "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
      };

      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create product.");
      return json;
    },
    onSuccess: (json) => {
      setFeedback(json.message || "Product created successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin_products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin_audit_logs"] });
      setIsCreateOpen(false);
      setNewTitle("");
      setNewPrice("");
      setNewStock("");
      setNewDescription("");
      setNewImageUrl("");
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: Error) => {
      setFeedback(err.message);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  // Update Product Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, price, stock }: { id: string; price: number; stock: number }) => {
      const res = await fetch(`/api/v1/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price, stock }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update product.");
      return json;
    },
    onSuccess: (json) => {
      setFeedback(json.message || "Product updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin_products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin_audit_logs"] });
      setEditingProduct(null);
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: Error) => {
      setFeedback(err.message);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  // Soft-Archive Product Mutation
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to archive product.");
      return json;
    },
    onSuccess: (json) => {
      setFeedback(json.message || "Product archived.");
      queryClient.invalidateQueries({ queryKey: ["admin_products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin_audit_logs"] });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  // Permanent Purge Mutation
  const purgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/products/${id}?permanent=true`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to permanently purge product.");
      return json;
    },
    onSuccess: (json) => {
      setFeedback(json.message || "Product permanently purged.");
      queryClient.invalidateQueries({ queryKey: ["admin_products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin_audit_logs"] });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  // Update Order Status Mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update order status.");
      return json;
    },
    onSuccess: (json) => {
      setFeedback(json.message || "Order status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin_audit_logs"] });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: Error) => {
      setFeedback(err.message);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  // Overview Metrics Calculations
  const totalProducts = products.length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 3).length;
  const totalInventoryUnits = products.reduce((acc, p) => acc + p.stock, 0);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2">
              <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-200">Storefront</Link>
              <span>/</span>
              <span className="text-zinc-800 dark:text-zinc-200">Admin Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-amber-500" />
              <span>Catalog & Store Operations</span>
            </h1>
          </div>

          {activeTab === "products" && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold btn-tactile shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Product</span>
            </button>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium flex items-center gap-2 shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Segmented Tab Navigation Control */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 mb-8 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors btn-tactile cursor-pointer ${
              activeTab === "products"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products & Inventory</span>
            <span className="ml-1 text-[10px] font-mono opacity-80">({totalProducts})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors btn-tactile cursor-pointer ${
              activeTab === "orders"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Orders</span>
            {orders.length > 0 && (
              <span className="ml-1 text-[10px] font-mono opacity-80">({orders.length})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors btn-tactile cursor-pointer ${
              activeTab === "audit"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Inventory Audit Trail</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: PRODUCTS & INVENTORY */}
        {/* ============================================================== */}
        {activeTab === "products" && (
          <div className="space-y-8">
            {/* KPI Metrics Strip */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Catalog Items</span>
                  <Package className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono">
                  <AnimatedCounter value={totalProducts} />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Total Units in Stock</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  <AnimatedCounter value={totalInventoryUnits} />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Low Stock Items</span>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                  <AnimatedCounter value={lowStockCount} />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Out of Stock</span>
                  <Archive className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                  <AnimatedCounter value={outOfStockCount} />
                </div>
              </div>
            </section>

            {/* Product Inventory Table */}
            <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Product Inventory
                </h2>
                <span className="text-xs font-mono text-zinc-400">Live Inventory Feed</span>
              </div>

              {isProductsLoading ? (
                <div className="p-8 text-center text-xs text-zinc-400">Loading catalog items...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-mono uppercase text-[10px] tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-4">Product Details</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Stock Units</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                                <Image src={p.imageUrl} alt={p.title} fill sizes="40px" className="object-cover" />
                              </div>
                              <div>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                                  {p.title}
                                </span>
                                <span className="text-[11px] font-mono text-zinc-400">/{p.slug}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-medium">
                            {p.category?.name || "Uncategorized"}
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            ${p.price.toFixed(2)}
                          </td>

                          <td className="py-3 px-4 font-mono font-medium">
                            {p.stock <= 0 ? (
                              <span className="text-rose-500 font-bold">0 units (Out of Stock)</span>
                            ) : p.stock <= 3 ? (
                              <span className="text-amber-500 font-bold">{p.stock} units (Low Stock)</span>
                            ) : (
                              <span className="text-zinc-800 dark:text-zinc-200">{p.stock} units</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {p.isArchived ? (
                              <span className="px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase">
                                Archived
                              </span>
                            ) : p.stock <= 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-bold uppercase">
                                Sold Out
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold uppercase">
                                Active
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Quick Edit */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct(p);
                                  setEditPrice(p.price.toString());
                                  setEditStock(p.stock.toString());
                                }}
                                className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-tactile cursor-pointer"
                              >
                                Edit
                              </button>

                              {/* Archive Button */}
                              {!p.isArchived && (
                                <HoldToConfirmButton
                                  label="Archive"
                                  holdingLabel="Archiving..."
                                  holdDurationMs={1200}
                                  variant="warning"
                                  size="sm"
                                  onConfirm={() => archiveMutation.mutate(p.id)}
                                />
                              )}

                              {/* Purge Button */}
                              <HoldToConfirmButton
                                label="Purge"
                                holdingLabel="Purging..."
                                holdDurationMs={1200}
                                variant="danger"
                                size="sm"
                                onConfirm={() => purgeMutation.mutate(p.id)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CUSTOMER ORDER FULFILLMENT MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Status Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Filter by Status:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {["ALL", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors btn-tactile cursor-pointer ${
                      orderStatusFilter === status
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Listing */}
            {isOrdersLoading ? (
              <div className="p-12 text-center text-xs text-zinc-400">Loading customer orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                <ShoppingBag className="w-8 h-8 text-zinc-400 mx-auto mb-2 stroke-1" />
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No Orders Found</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  No orders match the selected filter &ldquo;{orderStatusFilter}&rdquo;.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  let statusBadgeClass = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
                  let StatusIcon = Clock;

                  if (order.status === "PROCESSING") {
                    statusBadgeClass = "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300/40";
                    StatusIcon = Clock;
                  } else if (order.status === "SHIPPED") {
                    statusBadgeClass = "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300/40";
                    StatusIcon = Truck;
                  } else if (order.status === "DELIVERED") {
                    statusBadgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40";
                    StatusIcon = CheckCircle2;
                  } else if (order.status === "CANCELLED") {
                    statusBadgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/40";
                    StatusIcon = XCircle;
                  }

                  return (
                    <article
                      key={order.id}
                      className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 sm:p-6 shadow-xs"
                    >
                      {/* Order Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              {order.orderNumber}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusBadgeClass}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span>{order.status}</span>
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-1">
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{order.user?.fullName || order.shippingAddress.fullName}</span>
                              <span className="text-zinc-400">({order.user?.email || "Guest"})</span>
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1 text-zinc-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formattedDate}</span>
                            </span>
                          </div>
                        </div>

                        {/* Order Fulfillment Quick Actions */}
                        <div className="flex items-center gap-2">
                          {order.status === "PROCESSING" && (
                            <button
                              type="button"
                              onClick={() =>
                                updateOrderStatusMutation.mutate({
                                  orderId: order.id,
                                  status: "SHIPPED",
                                })
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold btn-tactile cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Mark as Shipped</span>
                            </button>
                          )}

                          {order.status === "SHIPPED" && (
                            <button
                              type="button"
                              onClick={() =>
                                updateOrderStatusMutation.mutate({
                                  orderId: order.id,
                                  status: "DELIVERED",
                                })
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold btn-tactile cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark as Delivered</span>
                            </button>
                          )}

                          {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                            <HoldToConfirmButton
                              label="Cancel Order"
                              holdingLabel="Cancelling..."
                              holdDurationMs={1200}
                              variant="danger"
                              size="sm"
                              onConfirm={() =>
                                updateOrderStatusMutation.mutate({
                                  orderId: order.id,
                                  status: "CANCELLED",
                                })
                              }
                            />
                          )}
                        </div>
                      </div>

                      {/* Line Items & Shipping Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
                        {/* Ordered Items */}
                        <div className="md:col-span-2 space-y-2">
                          <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-400 block">
                            Ordered Items ({order.items.length})
                          </span>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800"
                              >
                                <div className="flex items-center gap-2.5">
                                  {item.product?.imageUrl && (
                                    <div className="relative w-8 h-8 rounded overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0">
                                      <Image
                                        src={item.product.imageUrl}
                                        alt={item.product.title}
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                      />
                                    </div>
                                  )}
                                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {item.product?.title || "Product item"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 font-mono">
                                  <span className="text-zinc-400">Qty: {item.quantity}</span>
                                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                    ${(item.unitPrice * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Customer & Shipping Details */}
                        <div className="p-3 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 space-y-2">
                          <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-400 block">
                            Fulfillment Details
                          </span>
                          <div className="flex items-start gap-2 text-zinc-600 dark:text-zinc-300">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-semibold block">{order.shippingAddress.fullName}</span>
                              <span>{order.shippingAddress.addressLine1}</span>
                              <span className="block">
                                {order.shippingAddress.city}, {order.shippingAddress.country}
                              </span>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center font-bold">
                            <span className="text-zinc-500">Total Order Amount</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400">
                              ${order.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: INVENTORY & OPERATIONS AUDIT TRAIL */}
        {/* ============================================================== */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            {/* Audit Filter */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Filter Audit Records:
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {["ALL", "PRODUCT", "ORDER"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAuditTypeFilter(type)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors btn-tactile cursor-pointer ${
                      auditTypeFilter === type
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    {type === "ALL" ? "All Operations" : `${type} Events`}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Records Table */}
            <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  System Audit Log
                </h2>
                <span className="text-xs font-mono text-zinc-400">
                  Immutable PostgreSQL Activity Trail
                </span>
              </div>

              {isAuditLoading ? (
                <div className="p-8 text-center text-xs text-zinc-400">Loading audit records...</div>
              ) : auditLogs.length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-400">No audit events recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-mono uppercase text-[10px] tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Entity</th>
                        <th className="py-3 px-4">Activity Details</th>
                        <th className="py-3 px-4">Actor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                      {auditLogs.map((log) => {
                        const dateStr = new Date(log.timestamp).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        });

                        let actionBadgeClass = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
                        if (log.action === "CREATE") {
                          actionBadgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
                        } else if (log.action === "UPDATE") {
                          actionBadgeClass = "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300";
                        } else if (log.action === "ARCHIVE") {
                          actionBadgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
                        } else if (log.action === "STATUS_CHANGE") {
                          actionBadgeClass = "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300";
                        }

                        return (
                          <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">{dateStr}</td>

                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${actionBadgeClass}`}>
                                {log.action}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-zinc-500">
                              {log.entityType} ({log.entityId.slice(0, 8)}...)
                            </td>

                            <td className="py-3 px-4 text-zinc-800 dark:text-zinc-200">
                              {JSON.stringify(log.details)}
                            </td>

                            <td className="py-3 px-4 text-zinc-400 text-[11px]">
                              {log.performedBy.slice(0, 10)}...
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* CREATE PRODUCT MODAL */}
        {/* ============================================================== */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Add Catalog Product
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-500 font-medium mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Ergonomic Keyboard"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Price ($)</label>
                  <input
                    type="text"
                    required
                    value={newPrice}
                    onKeyDown={handlePriceKeyDown}
                    onChange={(e) => handlePriceChange(e.target.value, setNewPrice)}
                    placeholder="189.99"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Stock Count</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newStock}
                    onKeyDown={handleStockKeyDown}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="15"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-500 font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="dark:bg-zinc-900">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-500 font-medium mb-1">Image URL</label>
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-500 font-medium mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Detailed specifications and build materials..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold btn-tactile cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={createMutation.isPending || !newTitle || !newPrice || !newStock}
                  onClick={() => createMutation.mutate()}
                  className="px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold btn-tactile cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating..." : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* EDIT PRODUCT MODAL */}
        {/* ============================================================== */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Update Price & Stock: {editingProduct.title}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Price ($)</label>
                  <input
                    type="text"
                    value={editPrice}
                    onKeyDown={handlePriceKeyDown}
                    onChange={(e) => handlePriceChange(e.target.value, setEditPrice)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Available Stock Count</label>
                  <input
                    type="number"
                    min={0}
                    value={editStock}
                    onKeyDown={handleStockKeyDown}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold btn-tactile cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({
                      id: editingProduct.id,
                      price: parseFloat(editPrice),
                      stock: parseInt(editStock, 10),
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold btn-tactile cursor-pointer disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
