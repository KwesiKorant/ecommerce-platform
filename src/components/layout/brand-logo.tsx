import React from "react";
import { cn } from "@/lib/utils";

export interface BrandLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * BrandLogo
 * Modern shopping bag vector logo.
 * Uses stroke="currentColor" and strokeWidth="28" to seamlessly adapt across dark/light modes.
 */
export function BrandLogo({ className, ...props }: BrandLogoProps) {
  return (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        fill="none"
        stroke="currentColor"
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Ecommerce Brand Mark"
        className={cn("w-auto h-full shrink-0", className)}
        {...props}
      >
        <rect x="76" y="148" width="360" height="304" rx="36" />
        <path d="M176 148V120C176 75.8172 211.817 40 256 40C300.183 40 336 75.8172 336 120V148" />
        <line x1="220" y1="280" x2="304" y2="280" />
        <polyline points="274 250 304 280 274 310" />
      </svg>
  );
}
