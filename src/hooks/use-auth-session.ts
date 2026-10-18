"use client";

import { useQuery } from "@tanstack/react-query";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "CUSTOMER";
}

/**
 * Deduplicated, cached client authentication session hook.
 * Stale time of 60 seconds with zero-overhead background revalidation.
 */
export function useAuthSession() {
  const query = useQuery<{ user: AuthUser | null }>({
    queryKey: ["auth_me"],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/me");
      if (!res.ok) return { user: null };
      const json = await res.json();
      return { user: json?.success && json?.data?.user ? json.data.user : null };
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const user = query.data?.user ?? null;
  const isAdmin = user?.role === "ADMIN";
  const isCustomer = user?.role === "CUSTOMER";

  return {
    user,
    isAdmin,
    isCustomer,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
