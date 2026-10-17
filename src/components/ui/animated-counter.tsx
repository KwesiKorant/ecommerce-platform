"use client";

import React, { useEffect, useRef } from "react";

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

/**
 * 120 FPS Tabular Animated Counter
 * Mutates spanRef.current.textContent directly in an active RAF loop
 * with cubic ease-out, tabular layout lock, and zero React reconciler overhead.
 */
export function AnimatedCounter({
  value,
  duration = 600,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: AnimatedCounterProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(value);
  const isFirstRender = useRef(true);

  const formatNumber = (num: number): string => {
    return `${prefix}${num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`;
  };

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    // Skip count-up animation on initial SSR hydration mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      el.textContent = formatNumber(value);
      prevValueRef.current = value;
      return;
    }

    const startVal = prevValueRef.current;
    const endVal = value;
    prevValueRef.current = value;

    if (startVal === endVal) {
      el.textContent = formatNumber(endVal);
      return;
    }

    // Prefers-reduced-motion check
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = formatNumber(endVal);
      return;
    }

    let rafId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Strong cubic ease-out: 1 - (1 - t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easeProgress;

      el.textContent = formatNumber(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        el.textContent = formatNumber(endVal);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [value, duration, decimals, prefix, suffix]);

  return (
    <span
      ref={spanRef}
      className={`font-mono tabular-nums tracking-tight ${className}`}
    >
      {formatNumber(value)}
    </span>
  );
}
