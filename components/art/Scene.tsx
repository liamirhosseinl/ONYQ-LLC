import type { CSSProperties, ReactNode } from "react";
import { SPARK } from "@/components/ui/brand-geometry.ts";
import { mulberry32 } from "./BrandArt.tsx";

/**
 * Photographic scenes (owner-supplied panoramas, day + night) with living overlays.
 *
 * The stage keeps the panorama's aspect ratio and covers the box like object-fit: cover,
 * but scaled by `cover` relative to the box height so a band of page colour can fade in
 * below it. Overlays inside the stage are positioned in % of the picture, so they stay
 * pinned to the same spot (the glass sphere, the moon, the city) at every viewport size.
 * Both theme variants are rendered; CSS cross-fades them when the theme changes.
 */
export function Scene({
  name,
  ratio,
  cover = 1.9,
  focus = [0.75, 0],
  focusMobile,
  className = "",
  children,
  priority = false,
}: {
  name: string;
  ratio: number;
  cover?: number;
  focus?: [number, number];
  focusMobile?: [number, number];
  className?: string;
  children?: ReactNode;
  priority?: boolean;
}) {
  const style = {
    "--ratio": ratio,
    "--cover": cover,
    "--fx": focus[0],
    "--fy": focus[1],
    "--fx-m": (focusMobile ?? focus)[0],
    "--fy-m": (focusMobile ?? focus)[1],
  } as CSSProperties;
  return (
    <div className={`scene ${className}`} style={style} aria-hidden="true">
      <div className="scene__stage">
        <div className="scene__pan">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="scene__img scene__img--night" src={`/scene/${name}-night.webp`} alt="" width={2600} height={Math.round(2600 / ratio)} decoding="async" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="scene__img scene__img--day" src={`/scene/${name}-day.webp`} alt="" width={2600} height={Math.round(2600 / ratio)} decoding="async" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />
          <div className="scene__sheen" />
          {children}
        </div>
      </div>
    </div>
  );
}

/** Twinkling stars in a region of the sky (night only). Positions are deterministic. */
export function SceneStars({ count = 40, seed = 11, area = [0, 0, 100, 40] }: { count?: number; seed?: number; area?: [number, number, number, number] }) {
  const r = mulberry32(seed);
  const [x0, y0, x1, y1] = area;
  return (
    <div className="scene__stars">
      {Array.from({ length: count }, (_, i) => {
        const s = r();
        return (
          <i
            key={i}
            style={
              {
                left: `${(x0 + r() * (x1 - x0)).toFixed(2)}%`,
                top: `${(y0 + r() * (y1 - y0)).toFixed(2)}%`,
                "--s": `${(1 + s * 2.2).toFixed(1)}px`,
                "--d": `${(2.5 + r() * 4).toFixed(2)}s`,
                "--delay": `${(-r() * 6).toFixed(2)}s`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

/** Warm window lights that blink softly over the city (night) — or rising dust motes by day. */
export function SceneLights({ count = 28, seed = 5, area }: { count?: number; seed?: number; area: [number, number, number, number] }) {
  const r = mulberry32(seed);
  const [x0, y0, x1, y1] = area;
  return (
    <div className="scene__lights">
      {Array.from({ length: count }, (_, i) => (
        <i
          key={i}
          style={
            {
              left: `${(x0 + r() * (x1 - x0)).toFixed(2)}%`,
              top: `${(y0 + r() * (y1 - y0)).toFixed(2)}%`,
              "--d": `${(3 + r() * 5).toFixed(2)}s`,
              "--delay": `${(-r() * 8).toFixed(2)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Floating motes / fireflies drifting upward across a band of the picture. */
export function SceneMotes({ count = 16, seed = 9, area }: { count?: number; seed?: number; area: [number, number, number, number] }) {
  const r = mulberry32(seed);
  const [x0, y0, x1, y1] = area;
  return (
    <div className="scene__motes">
      {Array.from({ length: count }, (_, i) => (
        <i
          key={i}
          style={
            {
              left: `${(x0 + r() * (x1 - x0)).toFixed(2)}%`,
              top: `${(y0 + r() * (y1 - y0)).toFixed(2)}%`,
              "--d": `${(9 + r() * 10).toFixed(2)}s`,
              "--delay": `${(-r() * 18).toFixed(2)}s`,
              "--dx": `${((r() - 0.5) * 60).toFixed(0)}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** A soft light source (moon, sun, lantern) that breathes. */
export function SceneGlow({ x, y, size, tone = "moon", only }: { x: number; y: number; size: number; tone?: "moon" | "sun" | "warm"; only?: "night" | "day" }) {
  return (
    <span
      className={`scene__glow scene__glow--${tone}${only ? ` scene__only-${only}` : ""}`}
      style={{ left: `${x}%`, top: `${y}%`, width: `${size}%` } as CSSProperties}
    />
  );
}

/** The ONYQ spark, alive inside a glass sphere: core, rotating flare, rays and caustic ring. */
export function SceneSpark({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <span className="scene__spark" style={{ left: `${x}%`, top: `${y}%`, width: `${size}%` } as CSSProperties}>
      <span className="scene__spark-rays" />
      <span className="scene__spark-halo" />
      <svg className="scene__spark-svg" viewBox="0 0 100 100">
        <path className="scene__spark-flare" d={SPARK} transform="translate(50 50) rotate(45) scale(0.62) translate(-50 -50)" />
        <path className="scene__spark-core" d={SPARK} />
      </svg>
    </span>
  );
}
