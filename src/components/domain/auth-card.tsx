"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { sanitizeRedirectUrl } from "@/lib/security";
import { BrandLogo } from "@/components/layout/brand-logo";

export interface AuthCardProps {
  initialMode?: "login" | "register";
  redirectNext?: string;
  onSuccess?: () => void;
}

export function AuthCard({ initialMode = "login", redirectNext = "/", onSuccess }: AuthCardProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  // Non-destructive URL synchronization with browser back/forward buttons
  const switchMode = (newMode: "login" | "register") => {
    if (newMode === mode) return;
    setDirection(newMode === "register" ? 1 : -1);
    setMode(newMode);
    setErrorMessage("");

    const targetUrl = newMode === "register" ? "/login?mode=register" : "/login";
    window.history.pushState(null, "", targetUrl);
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setMode(params.get("mode") === "register" ? "register" : "login");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = mode === "register" ? "/api/v1/auth/register" : "/api/v1/auth/login";
      const payload = mode === "register" ? { email, password, fullName } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Authentication failed.");
      }

      // Success: redirect safely with CWE-601 validation
      if (onSuccess) {
        onSuccess();
      } else {
        const safeDestination = sanitizeRedirectUrl(redirectNext);
        window.location.href = safeDestination;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication error.";
      setErrorMessage(msg);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={`w-full max-w-md mx-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-6 sm:p-8 shadow-xl overflow-hidden ${
        isShaking ? "animate-shake" : ""
      }`}
    >
      {/* Mode Switcher Segmented Control with Shared-ID Pill */}
      <div className="relative flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 mb-6">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`relative flex-1 py-1.5 text-xs font-semibold text-center z-10 transition-colors btn-tactile ${
            mode === "login" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {mode === "login" && (
            <motion.div
              layoutId="mode-pill"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              className="absolute inset-0 rounded-lg bg-white dark:bg-zinc-900 shadow-xs -z-10"
            />
          )}
          Sign In
        </button>

        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`relative flex-1 py-1.5 text-xs font-semibold text-center z-10 transition-colors btn-tactile ${
            mode === "register" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {mode === "register" && (
            <motion.div
              layoutId="mode-pill"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              className="absolute inset-0 rounded-lg bg-white dark:bg-zinc-900 shadow-xs -z-10"
            />
          )}
          Create Account
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 text-center flex flex-col items-center">
        <BrandLogo className="h-9 w-auto text-zinc-900 dark:text-zinc-100 mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {mode === "login" ? "Welcome Back" : "Create Your Account"}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          {mode === "login"
            ? "Sign in to access your orders and checkout history"
            : "Create an account to track orders and save your preferences"}
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form with Directional popLayout Transitions */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence mode="popLayout" custom={direction}>
          {mode === "register" && (
            <motion.div
              key="field-name"
              custom={direction}
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  required={mode === "register"}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ama Serwaa"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>
            </motion.div>
          )}

          <div key="field-email">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@ecommerce.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              />
            </div>
          </div>

          <div key="field-pass">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              />
            </div>
          </div>
        </AnimatePresence>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold btn-tactile shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <span>Processing...</span>
          ) : (
            <>
              <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        {/* Demo Credentials Helper */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1">
          <div className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pre-seeded Demo Accounts:</span>
          </div>
          <div className="flex justify-between font-mono">
            <span>Customer: customer@ecommerce.com</span>
            <span>CustomerPass123!</span>
          </div>
          <div className="flex justify-between font-mono">
            <span>Admin: admin@ecommerce.com</span>
            <span>AdminPass123!</span>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
