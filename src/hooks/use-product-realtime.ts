"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useProductRealtime(onUpdate?: (payload: unknown) => void) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("realtime-products-catalog")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Product",
        },
        (payload) => {
          // Immediately invalidate catalog queries so out-of-stock badges refresh
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["product"] });

          if (onUpdate) {
            onUpdate(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, onUpdate]);
}
