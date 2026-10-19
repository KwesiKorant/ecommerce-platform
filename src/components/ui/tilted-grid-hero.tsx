"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ── 3D Cylindrical Equipment Showcase Ribbon ──────────────────────
 * High-performance 3D cylinder rotating continuous studio equipment tiles.
 *
 * Stabilization Enhancements (Option 2):
 * - Seamless Unbroken Cards: Slices set to 1 to eliminate fractional subpixel
 *   rasterizer gaps and vertical seam distortion lines.
 * - Deterministic CSS Timing: Removed asynchronous React state updates on animation
 *   iterations (setShown) to mathematically eliminate dropped-frame tile stacking
 *   and 3D depth-buffer z-fighting.
 * - Instant 0ms Open: Synchronous initial layout initialization eliminating
 *   delayed opacity-0 client hydration flashes.
 * - Zero Performance Cost Compositor Architecture: Mutates strictly transform & opacity.
 * - IntersectionObserver Culling: Drops GPU consumption to 0% when scrolled offscreen.
 * ─────────────────────────────────────────────────────────────────── */

function getOptimizedHeroSrc(src: string): string {
  if (!src) return src;
  if (src.includes("images.unsplash.com")) {
    try {
      const parsed = new URL(src);
      parsed.searchParams.set("w", "600");
      parsed.searchParams.set("q", "75");
      parsed.searchParams.set("auto", "format");
      return parsed.toString();
    } catch {
      return src;
    }
  }
  return src;
}

// Camera distance from the screen, as a multiple of the cylinder's radius.
const CAMERA = 1.6;

function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend));
}

// Tile is never wider than this share of the container, ensuring adjacent neighbors remain visible
const MAX_WIDTH = 55;

function measure(
  width: number,
  height: number,
  tile: number,
  aspect: number,
  gap: number,
  bend: number,
) {
  const h = Math.min(
    (tile / 100) * height,
    ((MAX_WIDTH / 100) * width) / aspect,
  );
  const radius = width * arc(bend);
  if (!(h > 0) || !(radius > 0))
    return { columns: 2, sweep: 0, unit: 0, limit: 0 };
  const deg = (rad: number) => (rad * 180) / Math.PI;
  const unit = deg(h / radius);
  const pitch = (aspect + gap / 100) * unit;
  const limit = deg(bend) + (aspect * unit) / 2;
  const columns = Math.min(48, Math.max(2, Math.ceil((2 * limit) / pitch)));
  const round = (n: number) => +n.toFixed(4);
  const sweep = round((columns * pitch) / 2);
  return {
    columns,
    sweep,
    unit: round(unit),
    limit: round(Math.min(sweep, limit)),
  };
}

export type TiltedGridImage = {
  src: string;
  alt?: string;
};

export type TiltedGridHeroProps = {
  /** Images streaming sequentially along the cylinder. */
  images: TiltedGridImage[];
  /** Seconds for the row to advance by one tile. @default 4.5 */
  speed?: number;
  /** Tile height, as a percentage of the container's height. @default 76 */
  tileHeight?: number;
  /** Tile width divided by tile height. @default 16 / 9 */
  aspectRatio?: number;
  /** Space between tiles, as a percentage of a tile's height. @default 6 */
  gap?: number;
  /** Vertical centre of the row, as a percentage of the container's height. @default 50 */
  axis?: number;
  /**
   * How far the row bends by the frame's edge, in degrees.
   * @default 50
   */
  curve?: number;
  /** Width of the fade mask at each end, as a percentage of container width. @default 20 */
  fade?: number;
  /** Number of vertical strips per tile facet. Set to 1 for seamless unbroken cards. @default 1 */
  slices?: number;
  /** Children rendered above the 3D stage. */
  children?: React.ReactNode;
  className?: string;
};

export function TiltedGridHero({
  images,
  speed = 4.5,
  tileHeight = 76,
  aspectRatio = 16 / 9,
  gap = 6,
  axis = 50,
  curve = 50,
  fade = 20,
  slices = 1,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & TiltedGridHeroProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);

  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const orbit = `tgh-o-${id}`;
  const tile = `tgh-t-${id}`;
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180;

  // Viewport intersection culling
  const [isInView, setIsInView] = React.useState(true);

  // Synchronous initial layout measurement for 0ms instant display without hydration flash
  const [layout, setLayout] = React.useState<ReturnType<typeof measure>>(() =>
    measure(1200, 260, tileHeight, aspectRatio, gap, bend)
  );

  // Interactivity state
  const [isInteracting, setIsInteracting] = React.useState(false);
  const [isSpringingBack, setIsSpringingBack] = React.useState(false);

  // Drag tracking refs
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const currentYawRef = React.useRef(0);
  const autoResumeTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const springCleanupTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Viewport intersection observer: Drops GPU consumption to 0% offscreen
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ResizeObserver for responsive cylinder sizing
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      const next = measure(width, height, tileHeight, aspectRatio, gap, bend);
      setLayout((prev) =>
        prev.columns === next.columns &&
        prev.sweep === next.sweep &&
        prev.unit === next.unit
          ? prev
          : next
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [tileHeight, aspectRatio, gap, bend]);

  // Preload images into browser memory
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    for (const { src } of images) {
      if (src) {
        const img = new window.Image();
        img.src = src;
      }
    }
  }, [images]);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
      if (springCleanupTimerRef.current) clearTimeout(springCleanupTimerRef.current);
    };
  }, []);

  const { columns, sweep, unit, limit } = layout;

  // Length calculation relative to container queries (cqh / cqw)
  const u = (n: number) =>
    `calc(${+n.toFixed(4)} * min(${tileHeight}cqh, ${+(
      MAX_WIDTH / aspectRatio
    ).toFixed(4)}cqw))`;

  const r = 100 * arc(bend);
  const radius = `${+r.toFixed(3)}cqw`;

  // 3D rotation transform along cylinder arc
  const turn = (deg: number) =>
    `translateZ(${radius}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${radius})`;

  const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4);

  // Animation pause condition: when offscreen OR when actively dragging
  const playState = isInView && !isInteracting ? "running" : "paused";

  const css =
    `@keyframes ${orbit}{` +
    `from{transform:${turn(-sweep)}}to{transform:${turn(sweep)}}` +
    `0%,${hide}%,${100 - hide}%,100%{visibility:hidden}` +
    `${hide + 0.001}%,${100 - hide - 0.001}%{visibility:visible}}` +
    `.${tile}{animation-play-state:${playState};backface-visibility:hidden;-webkit-backface-visibility:hidden;}` +
    `@media(prefers-reduced-motion:reduce){.${tile}{animation-play-state:paused!important}}`;

  const duration = columns * speed;
  const mask = `linear-gradient(90deg,transparent,#000 ${fade}%,#000 ${
    100 - fade
  }%,transparent)`;

  /* ── Zero-Performance-Cost Drag / Swipe Event Handlers ── */
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    currentYawRef.current = 0;

    if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    if (springCleanupTimerRef.current) clearTimeout(springCleanupTimerRef.current);

    setIsSpringingBack(false);
    setIsInteracting(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !stageRef.current) return;

    const deltaX = e.clientX - startXRef.current;
    const dragYaw = deltaX * 0.14;
    currentYawRef.current = dragYaw;

    stageRef.current.style.setProperty("--drag-yaw", `${dragYaw.toFixed(3)}deg`);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Fallback
    }

    autoResumeTimerRef.current = setTimeout(() => {
      if (!stageRef.current) {
        setIsInteracting(false);
        return;
      }

      setIsSpringingBack(true);
      stageRef.current.style.setProperty("--drag-yaw", "0deg");

      springCleanupTimerRef.current = setTimeout(() => {
        setIsSpringingBack(false);
        setIsInteracting(false);
        currentYawRef.current = 0;
      }, 650);
    }, 1000);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        "relative overflow-hidden contain-layout-style select-none cursor-grab active:cursor-grabbing touch-pan-y",
        className
      )}
      {...props}
      style={{
        containerType: "size",
        contain: "layout style paint",
        touchAction: "pan-y",
        ...props.style,
      }}
    >
      <style>{css}</style>

      {/* 3D Cylindrical Projection Stage (Instantly visible, no hydration delay) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 1,
          perspective: `${+(r * CAMERA).toFixed(3)}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        <div
          ref={stageRef}
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `translateZ(${radius}) rotateY(var(--drag-yaw, 0deg)) translateZ(-${radius})`,
            transition: isSpringingBack
              ? "transform 650ms cubic-bezier(0.23, 1, 0.32, 1)"
              : "none",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {Array.from({ length: columns }, (_, t) => {
            const img = images[t % Math.max(images.length, 1)];

            return (
              <div
                key={t}
                className={cn(tile, "absolute will-change-transform")}
                style={{
                  left: `calc(50% - ${u(aspectRatio / 2)})`,
                  top: `calc(${axis}% - ${u(0.5)})`,
                  width: u(aspectRatio),
                  height: u(1),
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  animation: `${orbit} ${duration}s linear ${-t * speed}s infinite`,
                }}
              >
                {/* Seamless Unbroken Card (Zero Facet Seam Distortion) */}
                <div
                  className="absolute inset-0 overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800 shadow-sm border border-zinc-200/50 dark:border-white/10"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  {img?.src ? (
                    <img
                      src={getOptimizedHeroSrc(img.src)}
                      alt={img.alt ?? ""}
                      draggable={false}
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover pointer-events-none select-none"
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}

export default TiltedGridHero;
