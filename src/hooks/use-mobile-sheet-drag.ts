"use client";

import { useSyncExternalStore } from "react";
import type { PanInfo } from "motion/react";

function subscribeMediaQuery(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(max-width: 639px)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getSnapshotMediaQuery(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 639px)").matches;
}

function getServerSnapshotMediaQuery(): boolean {
  return false;
}

export interface MobileSheetDragOptions {
  onDismiss: () => void;
  dismissThresholdY?: number;
  dismissVelocityY?: number;
}

/**
 * Ergonomic Mobile Sheet Drag-to-Dismiss Hook
 * Handles SSR-safe mobile detection, directional touch resistance, and velocity projection.
 */
export function useMobileSheetDrag({
  onDismiss,
  dismissThresholdY = 90,
  dismissVelocityY = 400,
}: MobileSheetDragOptions) {
  const isMobile = useSyncExternalStore(
    subscribeMediaQuery,
    getSnapshotMediaQuery,
    getServerSnapshotMediaQuery
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isMobile) return;

    // Dismiss if pulled down past threshold or swiped with high downward velocity
    if (info.offset.y > dismissThresholdY || info.velocity.y > dismissVelocityY) {
      onDismiss();
    }
  };

  return {
    isMobile,
    dragProps: isMobile
      ? {
          drag: "y" as const,
          dragDirectionLock: true,
          dragConstraints: { top: 0, bottom: 0 },
          dragElastic: { top: 0.05, bottom: 0.75 },
          onDragEnd: handleDragEnd,
        }
      : {},
  };
}
