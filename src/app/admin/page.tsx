"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  RefreshCw,
  CheckCircle2,
  DollarSign,
  TrendingUp,
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

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Product Form State
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  // Edit Product Modal / Inline State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");

  // Fetch Categories
  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/v1/categories");
      const json = await res.json();
      return json.data;
    },
  });

  // Fetch Catalog Products (including archived for admin)
  const { data: productsData, isLoading } = useQuery<{ products: Product[] }>({
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

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];

  // Keystroke-Level Monetary Input Hardening (Arc-AA Standard Section 3.5)
  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block exponent notation, plus, and minus keys
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
    // Block duplicate decimal points
    if (e.key === "." && (e.currentTarget.value.includes(".") || !e.currentTarget.value)) {
      e.preventDefault();
    }
  };

  const handlePriceChange = (
    rawVal: string,
    setter: (val: string) => void
  ) => {
    // Strip non-numeric and non-period characters
    let cleanVal = rawVal.replace(/[^0-9.]/g, "");
    const parts = cleanVal.split(".");

    // Clamp fractional precision to strictly 2 decimal places
    if (parts.length > 2) cleanVal = `${parts[0]}.${parts.slice(1).join("")}`;
    if (parts.length === 2 && parts[1].length > 2) {
      cleanVal = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }

    // Absolute ceiling clamp: $999,999.99
    const num = parseFloat(cleanVal);
    if (!isNaN(num) && num > 999999.99) cleanVal = "999999.99";

    setter(cleanVal);
  };

  // Stock KeyDown Interceptor
  const handleStockKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
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
      setFeedback(json.message || "Product soft-archived.");
      queryClient.invalidateQueries({ queryKey: ["admin_products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2">
              <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-200">Storefront</Link>
              <span>/</span>
              <span className="text-zinc-800 dark:text-zinc-200">Admin Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-amber-500" />
              <span>Catalog & Inventory Management</span>
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold btn-tactile shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Product</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium flex items-center gap-2 shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* KPI Telemetry Metrics Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            <span className="text-xs font-mono text-zinc-400">
              Live Inventory Feed
            </span>
          </div>

          {isLoading ? (
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
                  {products.map((p) => {
                    return (
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
                            {/* Quick Edit Trigger */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(p);
                                setEditPrice(p.price.toString());
                                setEditStock(p.stock.toString());
                              }}
                              className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-tactile"
                            >
                              Edit
                            </button>

                            {/* Soft-Archive Tactile Button */}
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

                            {/* Permanent Purge Tactile Button */}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* CREATE PRODUCT MODAL */}
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
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold btn-tactile"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={createMutation.isPending || !newTitle || !newPrice || !newStock}
                  onClick={() => createMutation.mutate()}
                  className="px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold btn-tactile disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating..." : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT PRODUCT MODAL */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Update Price & Stock: {editingProduct.title}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">
                    Price ($)
                  </label>
                  <input
                    type="text"
                    value={editPrice}
                    onKeyDown={handlePriceKeyDown}
                    onChange={(e) => handlePriceChange(e.target.value, setEditPrice)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">
                    Available Stock Count
                  </label>
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
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold btn-tactile"
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
                  className="px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold btn-tactile disabled:opacity-50"
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
