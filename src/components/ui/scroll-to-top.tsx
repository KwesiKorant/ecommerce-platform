"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp } from "lucide-react";

/**
 * Page top unpainted sentinel element. Place at the very top of the page.
 */
export function ScrollToTopSentinel() {
  return (
    <div
      id="page-top-sentinel"
      aria-hidden="true"
      className="absolute top-0 left-0 w-full h-40 pointer-events-none -z-50 opacity-0 select-none"
    />
  );
}

/**
 * Sentinel-driven scroll-to-top button.
 * Uses native IntersectionObserver with zero main-thread scroll listeners.
 */
export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("page-top-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the sentinel is NOT intersecting (i.e. user has scrolled down), show button
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
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
          aria-label="Scroll to top of catalog"
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-30 p-2.5 sm:p-3 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xl btn-tactile cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
