"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ShieldCheck,
  User as UserIcon,
  Package,
  ArrowRight,
  X,
  AlertCircle,
  Building,
} from "lucide-react";

export interface Address {
  id: string;
  fullName: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt?: string;
}

interface AccountViewProps {
  initialUser?: UserProfile | null;
}

export function AccountView({ initialUser }: AccountViewProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: initialUser?.fullName || "",
    addressLine1: "",
    city: "",
    postalCode: "",
    country: "United States",
    isDefault: false,
  });

  // Query authenticated customer profile
  const { data: user } = useQuery<UserProfile | null>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data.user;
    },
    initialData: initialUser,
  });

  // Query customer orders for telemetry count
  const { data: orders = [] } = useQuery({
    queryKey: ["customer-orders"],
    queryFn: async () => {
      const res = await fetch("/api/v1/orders");
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!user,
  });

  // Query saved addresses
  const {
    data: addresses = [],
    isLoading: isLoadingAddresses,
    error: addressesError,
  } = useQuery<Address[]>({
    queryKey: ["customer-addresses"],
    queryFn: async () => {
      const res = await fetch("/api/v1/addresses");
      if (!res.ok) {
        throw new Error("Failed to load saved addresses.");
      }
      const json = await res.json();
      return json.data;
    },
    enabled: !!user,
  });

  // Create Address Mutation
  const createAddressMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await fetch("/api/v1/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to save address.");
      }
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
      closeModal();
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  // Update Address Mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Address> }) => {
      const res = await fetch(`/api/v1/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to update address.");
      }
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
      closeModal();
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  // Delete Address Mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/addresses/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to remove address.");
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
    },
  });

  // Modal open helper
  const openCreateModal = () => {
    setEditingAddress(null);
    setFormData({
      fullName: user?.fullName || "",
      addressLine1: "",
      city: "",
      postalCode: "",
      country: "United States",
      isDefault: addresses.length === 0,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFormData({
      fullName: addr.fullName,
      addressLine1: addr.addressLine1,
      city: addr.city,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.fullName.trim()) {
      setFormError("Full name is required.");
      return;
    }
    if (!formData.addressLine1.trim()) {
      setFormError("Street address is required.");
      return;
    }
    if (!formData.city.trim()) {
      setFormError("City is required.");
      return;
    }
    if (!formData.postalCode.trim()) {
      setFormError("Postal code is required.");
      return;
    }

    if (editingAddress) {
      updateAddressMutation.mutate({
        id: editingAddress.id,
        data: formData,
      });
    } else {
      createAddressMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 pb-24 md:pb-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6 font-mono">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            Storefront
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-100">Customer Account</span>
        </div>

        {/* Profile Banner */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-semibold text-xl tracking-wider">
                {user?.fullName
                  ? user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "AF"}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {user?.fullName || "Valued Customer"}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    Verified {user?.role || "CUSTOMER"}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 font-mono mt-0.5">{user?.email}</p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 sm:gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/80 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 border border-zinc-200/60 dark:border-zinc-800 text-center">
                <span className="block text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {orders.length}
                </span>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                  Total Orders
                </span>
              </div>
              <div className="flex-1 sm:flex-none bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 border border-zinc-200/60 dark:border-zinc-800 text-center">
                <span className="block text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {addresses.length}
                </span>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                  Addresses
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Saved Addresses */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                Saved Delivery Addresses
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Manage your preferred destinations for express checkout and parcel dispatch.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors btn-tactile cursor-pointer shadow-sm w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>

          {/* Address Cards Grid */}
          {isLoadingAddresses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/40 animate-pulse border border-zinc-200 dark:border-zinc-800"
                />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center mb-4">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                No saved shipping addresses
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-5">
                Add your primary address to unlock instant 1-click checkout for your studio gear orders.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer btn-tactile shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Primary Address</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`relative bg-white dark:bg-zinc-900 rounded-2xl p-5 border transition-all duration-150 flex flex-col justify-between ${
                    addr.isDefault
                      ? "border-emerald-500/50 dark:border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/20"
                      : "border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div>
                    {/* Header: Name and Default Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                          {addr.fullName}
                        </span>
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Default Shipping
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address Lines */}
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5 font-sans leading-relaxed">
                      <p>{addr.addressLine1}</p>
                      <p>
                        {addr.city}, {addr.postalCode}
                      </p>
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">{addr.country}</p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                    {!addr.isDefault ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateAddressMutation.mutate({
                            id: addr.id,
                            data: { isDefault: true },
                          })
                        }
                        disabled={updateAddressMutation.isPending}
                        className="text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-400 font-mono">Primary Destination</span>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => openEditModal(addr)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Edit address"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to remove this saved address?")) {
                            deleteAddressMutation.mutate(addr.id);
                          }
                        }}
                        disabled={deleteAddressMutation.isPending}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Link to Orders */}
        <div className="mt-12 bg-zinc-100/70 dark:bg-zinc-900/40 rounded-2xl p-6 border border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-xs border border-zinc-200/60 dark:border-zinc-700">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Looking for your order receipts?
              </h3>
              <p className="text-xs text-zinc-500">
                Track fulfillment statuses, courier milestones, and live dispatches.
              </p>
            </div>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors text-zinc-900 dark:text-zinc-100 btn-tactile shadow-xs"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      {/* Address Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {editingAddress ? "Edit Shipping Address" : "Add New Shipping Address"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                {formError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Ama Serwaa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    placeholder="e.g. 144 Silicon Ave, Suite 300"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. San Francisco"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="e.g. 94107"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g. United States"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                      Set as primary delivery address
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                    className="px-5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer btn-tactile shadow-sm"
                  >
                    {createAddressMutation.isPending || updateAddressMutation.isPending
                      ? "Saving..."
                      : editingAddress
                      ? "Save Changes"
                      : "Add Address"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
