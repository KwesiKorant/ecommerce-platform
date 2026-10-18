import React from "react";
import { Header } from "@/components/layout/header";

/**
 * Instant PDP Skeleton Shell
 * Rendered immediately by Next.js streaming runtime during navigation,
 * eliminating all perceptible latency while dynamic equipment specs stream in.
 */
export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 pb-24 md:pb-12">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <div className="w-16 h-3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="w-2 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-20 h-3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="w-2 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-32 h-3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>

        {/* Hero Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
          {/* Gallery Skeleton (7 cols) */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <div className="aspect-4/3 w-full rounded-2xl sm:rounded-3xl bg-zinc-200/70 dark:bg-zinc-800/60 animate-pulse border border-zinc-200 dark:border-zinc-800 shadow-sm" />
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-4/3 rounded-xl sm:rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/40 animate-pulse border border-zinc-200/60 dark:border-zinc-800/60"
                />
              ))}
            </div>
          </div>

          {/* Details & Action Dock Skeleton (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="w-32 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="w-3/4 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="space-y-2 pt-1">
                <div className="w-full h-3 rounded bg-zinc-200/70 dark:bg-zinc-800/70 animate-pulse" />
                <div className="w-5/6 h-3 rounded bg-zinc-200/70 dark:bg-zinc-800/70 animate-pulse" />
              </div>
            </div>

            {/* Price Box Skeleton */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-28 h-8 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="w-20 h-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
              <div className="w-full h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="w-full h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>

            {/* Assurance Skeleton */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800/40 animate-pulse border border-zinc-200/60 dark:border-zinc-800/60"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
