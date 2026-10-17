"use client";

import React, { useState, useRef, useCallback } from "react";

export interface HoldToConfirmButtonProps {
  onConfirm: () => void | Promise<void>;
  label: string;
  holdingLabel?: string;
  holdDurationMs?: number;
  variant?: "danger" | "warning" | "primary";
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Emil Kowalski Tactile Hold-To-Confirm Button Pattern
 * Asymmetric kinematics: 1.2s RAF hold fill with 160ms snappy snap-back.
 * Hardware-accelerated zero-reflow clip-path mask fill.
 */
export function HoldToConfirmButton({
  onConfirm,
  label,
  holdingLabel = "Hold to Confirm...",
  holdDurationMs = 1200,
  variant = "danger",
  disabled = false,
  className = "",
  size = "md",
}: HoldToConfirmButtonProps) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const cancelHold = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startTimeRef.current = null;
    setIsHolding(false);
    setProgress(0);
  }, []);

  const startHold = useCallback(() => {
    if (disabled) return;

    setIsHolding(true);
    const start = performance.now();
    startTimeRef.current = start;

    const tick = (now: number) => {
      const elapsed = now - start;
      const currentProgress = Math.min(1, elapsed / holdDurationMs);
      setProgress(currentProgress);

      if (currentProgress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Completed hold
        setIsHolding(false);
        setProgress(0);
        onConfirm();
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [disabled, holdDurationMs, onConfirm]);

  // Variant color definitions
  let baseColorClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60";
  let fillColorClass = "bg-rose-600/30 dark:bg-rose-500/40";

  if (variant === "warning") {
    baseColorClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60";
    fillColorClass = "bg-amber-500/30 dark:bg-amber-400/40";
  } else if (variant === "primary") {
    baseColorClass = "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700";
    fillColorClass = "bg-zinc-900/20 dark:bg-zinc-100/20";
  }

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-1.5 text-sm",
    lg: "px-5 py-2.5 text-base",
  }[size];

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          startHold();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cancelHold();
        }
      }}
      aria-label={label}
      className={`relative overflow-hidden select-none btn-tactile cursor-pointer border rounded-lg font-medium transition-colors ${baseColorClass} ${sizeClasses} ${
        disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
      } ${className}`}
    >
      {/* Zero-Reflow Clip-Path Progress Fill */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none transition-[clip-path] ${fillColorClass}`}
        style={{
          clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
          transition: isHolding ? "none" : "clip-path 160ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />

      <span className="relative z-10 flex items-center justify-center gap-1.5 font-medium">
        {isHolding ? (
          <>
            <span className="font-mono text-xs opacity-90">{Math.round(progress * 100)}%</span>
            <span>{holdingLabel}</span>
          </>
        ) : (
          label
        )}
      </span>
    </button>
  );
}
