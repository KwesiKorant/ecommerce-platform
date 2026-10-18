"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Command } from "lucide-react";

export interface ExpandingSearchDockProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * ExpandingSearchDock
 * High-performance search dock with debounced hover-to-expand (Option 2),
 * keyboard shortcuts (/ & ⌘K), and responsive width scaling for compact and desktop viewports.
 */
export function ExpandingSearchDock({
  value,
  onChange,
  placeholder = "Search catalog (/ or ⌘K)...",
  className = "",
}: ExpandingSearchDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // Global keyboard shortcuts: / and ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputActive =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      if ((e.key === "/" && !isInputActive) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === "Escape" && isExpanded) {
        if (value) {
          onChange("");
        } else {
          setIsExpanded(false);
          inputRef.current?.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, value, onChange]);

  // Click outside to collapse if empty and not focused
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        if (!value.trim()) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // Hover Intent Management (Option 2)
  const handleMouseEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    // Only auto-expand on hover for fine pointer devices (mouse/trackpad), not touch taps
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      hoverTimerRef.current = setTimeout(() => {
        setIsExpanded(true);
      }, 120);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // If input is not actively focused and has no text, collapse after 250ms debounce
    if (!value.trim() && document.activeElement !== inputRef.current) {
      leaveTimerRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 250);
    }
  }, [value]);

  const handleOpen = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    inputRef.current?.focus();
  };

  const handleInputBlur = () => {
    // If empty when blurred, gracefully collapse
    if (!value.trim()) {
      leaveTimerRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 200);
    }
  };

  return (
    <div
      ref={dockRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center ${className}`}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className={`flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden transition-colors ${
          isExpanded
            ? "w-36 sm:w-48 md:w-56 lg:w-64 max-w-[calc(100vw-110px)] px-2.5 sm:px-3 py-1.5 shadow-xs"
            : "w-9 h-9 sm:w-10 sm:h-10 p-2 justify-center cursor-pointer btn-tactile hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
        onClick={() => {
          if (!isExpanded) handleOpen();
        }}
      >
        <Search className="w-4 h-4 text-zinc-500 shrink-0 select-none cursor-pointer" />

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center flex-1 ml-2 min-w-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={handleInputBlur}
                onFocus={() => {
                  if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
                }}
                placeholder={placeholder}
                className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden truncate"
              />

              {value ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer shrink-0"
                  aria-label="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-400 font-mono select-none shrink-0">
                  <Command className="w-2.5 h-2.5" />
                  <span>K</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
