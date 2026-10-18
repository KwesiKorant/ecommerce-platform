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

      // 3. Touch & Mobile GPU Constraint Evaluation
      const isTouchDevice = navigator.maxTouchPoints > 1;

      if (isTouchDevice) {
        // Query WebGL unmasked renderer to detect entry/mid mobile GPUs directly
        try {
          const canvas = document.createElement("canvas");
          const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
          if (gl && "getExtension" in gl) {
            const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
            if (debugInfo) {
              const renderer = (
                (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ""
              ).toLowerCase();

              // Flag entry/mid-tier mobile GPUs with constrained TBDR raster fillrates
              if (
                renderer.includes("mali-") ||
                renderer.includes("powervr") ||
                renderer.includes("adreno 5") ||
                renderer.includes("adreno 61") ||
                renderer.includes("adreno (tm) 5") ||
                renderer.includes("adreno (tm) 61")
              ) {
                return "low";
              }
            }
          }
        } catch {
          // Fallback to hardware concurrency and viewport
        }

        // Low-tier mobile: Less than 6 cores, under 4GB device memory, or compact mobile screen
        const cores = navigator.hardwareConcurrency || 4;
        const memory = nav.deviceMemory || 4;

        if (cores < 6 || memory < 4 || (typeof window !== "undefined" && window.innerWidth < 768)) {
          return "low";
        }
      }

      // Desktop Macs and high-power PCs default to high-tier
      return "high";
    }

    const tier = evaluateCapability();
    setBlurTier(tier);

    // Synchronize dataset attribute on root html element
    document.documentElement.dataset.blurTier = tier;
  }, []);

  return { blurTier, isHighTier: blurTier === "high" };
}
