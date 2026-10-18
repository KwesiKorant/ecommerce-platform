"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp } from "lucide-react";

/**
 * Page top sentinel element (maintained for backward compatibility).
 */
export function ScrollToTopSentinel() {
  return (
    <div
      id="page-top-sentinel"
      aria-hidden="true"
      className="absolute top-0 left-0 w-full h-1 pointer-events-none -z-50 opacity-0 select-none"
    />
  );
}

/**
 * High-performance scroll-to-top button.
 * Uses passive scroll telemetry to reliably stay hidden at page top (scrollY <= 350px)
 * and smoothly spring into view when scrolled down.
 */
export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 350;
      setIsVisible((prev) => (prev !== shouldShow ? shouldShow : prev));
    };

    // Initial check on mount
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 12 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          aria-label="Scroll to top of page"
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-30 p-2.5 sm:p-3 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xl btn-tactile cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
