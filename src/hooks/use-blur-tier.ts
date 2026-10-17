"use client";

import { useState, useEffect } from "react";

export type BlurTier = "high" | "low";

/**
 * Separation Tier Architecture for Blur & Glassmorphism
 * Dynamically switches between high-tier luxury GPU backdrop blur
 * and low-tier zero-GPU solid surface tint + micro-border.
 *
 * Includes anti-fingerprinting core clamping bypass for macOS Safari.
 */
export function useBlurTier(): { blurTier: BlurTier; isHighTier: boolean } {
  const [blurTier, setBlurTier] = useState<BlurTier>("high");

  useEffect(() => {
    function evaluateCapability(): BlurTier {
      // 1. Respect user's OS preference for reduced transparency
      if (window.matchMedia("(prefers-reduced-transparency: reduce)").matches) {
        return "low";
      }

      // 2. Respect user's browser Data Saver mode
      const nav = navigator as unknown as {
        connection?: { saveData?: boolean };
        deviceMemory?: number;
      };
      if (nav.connection?.saveData === true) {
        return "low";
      }

      // 3. Desktop Isolation: Only evaluate CPU/RAM constraints on touch/mobile devices
      const isTouchDevice = navigator.maxTouchPoints > 1;

      if (isTouchDevice) {
        // Low-tier mobile: Less than 4 cores or under 3GB device memory
        const cores = navigator.hardwareConcurrency || 4;
        const memory = nav.deviceMemory || 4;

        if (cores < 4 || memory < 3) {
          return "low";
        }
      }

      // Desktop Macs and PCs default to high-tier
      return "high";
    }

    const tier = evaluateCapability();
    setBlurTier(tier);

    // Synchronize dataset attribute on root html element
    document.documentElement.dataset.blurTier = tier;
  }, []);

  return { blurTier, isHighTier: blurTier === "high" };
}
