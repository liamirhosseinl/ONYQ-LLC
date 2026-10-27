import type { CSSProperties } from "react";
import { DISC, RING, SPARK, SPARK_LONG, STONE } from "@/components/ui/brand-geometry.ts";

/**
 * Code-drawn artwork built only from the ONYQ vector kit (brand book §06: stone, spark, tail,
 * ring, half stone, quarter arc, constellation) and its textures (contour rings, data dot grid,
 * spark tile). Decorative — always aria-hidden. Motion hooks are CSS classes / data-attributes
 * picked up by styles/art.css and the motion director.
 */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Twinkling four-point sparks scattered over an area. */
export function Constellation({ count = 18, seed = 7, className = "" }: { count?: number; seed?: number; className?: string }) {
  const rand = mulberry32(seed);
  const stars = Array.from({ length: count }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    s: 6 + rand() * 16,
    d: rand() * 6,
    t: 3 + rand() * 4,
    o: rand() > 0.82,
  }));
  return (
    <div className={`constellation ${className}`} aria-hidden="true">
      {stars.map((st, i) => (
        <svg
          key={i}
          className={`constellation__star${st.o ? " constellation__star--volt" : ""}`}
          viewBox="24 24 52 52"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, animationDelay: `${st.d}s`, animationDuration: `${st.t}s` } as CSSProperties}
          focusable="false"
        >
          <path d={SPARK} fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}

/** Concentric contour rings around a point (brand texture "contour rings"). */
export function Rings({ count = 7, className = "", pulse = true }: { count?: number; className?: string; pulse?: boolean }) {
  return (
    <svg className={`rings ${className}`} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} className="rings__ring" cx="100" cy="100" r={28 + i * 11} style={{ "--ring": i } as CSSProperties} />
      ))}
      {pulse ? (
        <>
          <circle className="rings__pulse" cx="100" cy="100" r="60" />
          <circle className="rings__pulse rings__pulse--2" cx="100" cy="100" r="60" />
        </>
      ) : null}
    </svg>
  );
}

/** The mark as an object: stone with the spark at its heart, tail, glow and orbit. */
export function SparkStone({ id = "ss", className = "", orbit = false }: { id?: string; className?: string; orbit?: boolean }) {
  return (
    <div className={`spark-stone ${className}`} aria-hidden="true">
      <div className="spark-stone__glow" />
      {orbit ? (
        <svg className="spark-stone__orbit" viewBox="0 0 100 100" focusable="false">
          <circle cx="50" cy="50" r="48" />
          <circle cx="50" cy="50" r="48" className="spark-stone__orbit-dash" />
          <path className="spark-stone__satellite" d={SPARK} transform="translate(50 2) scale(0.16) translate(-50 -50)" />
        </svg>
      ) : null}
      <svg className="spark-stone__svg" viewBox="0 0 100 100" focusable="false">
        <defs>
          <radialGradient id={`${id}-stone`} cx="35%" cy="30%" r="80%">
            <stop offset="0" style={{ stopColor: "var(--stone-hi)" }} />
            <stop offset="1" style={{ stopColor: "var(--stone-lo)" }} />
          </radialGradient>
        </defs>
        <path className="spark-stone__stone" fillRule="evenodd" d={STONE} fill={`url(#${id}-stone)`} />
        <path className="spark-stone__spark" d={SPARK} />
        <g transform="translate(50 50) scale(0.62) translate(-50 -50)">
          <path className="spark-stone__flare" d={SPARK_LONG} />
        </g>
      </svg>
    </div>
  );
}

/** Closing scene for the footer and "next step" panels: forest glow, rings, cropped mark. */
export function GlowScene({ variant = "footer" }: { variant?: "footer" | "panel" }) {
  return (
    <div className={`glow-scene glow-scene--${variant}`} aria-hidden="true">
      <div className="glow-scene__bg" />
      <div className="glow-scene__mark" data-rotate="50">
        <svg viewBox="0 0 100 100" focusable="false">
          <path fillRule="evenodd" d={STONE} className="glow-scene__stone" />
          <path d={SPARK} className="glow-scene__spark" />
        </svg>
      </div>
      <Constellation count={variant === "footer" ? 26 : 14} seed={variant === "footer" ? 11 : 29} className="glow-scene__stars" />
      <div className="glow-scene__dots" />
    </div>
  );
}

/** Small kit shapes for cards and section ornaments. */
export function KitShape({ shape, className = "" }: { shape: "stone" | "ring" | "half" | "arc" | "spark" | "constellation" | "tail"; className?: string }) {
  const d: Record<string, string> = {
    stone: DISC,
    ring: RING,
    half: "M10 50 A40 40 0 0 1 90 50 Z",
    arc: "M10 90 A80 80 0 0 1 90 10 L90 30 A60 60 0 0 0 30 90 Z",
    spark: SPARK_LONG,
    tail: "M30 22 L78 70 L70 78 L22 30 Z",
    constellation:
      "M30 14 C31 26 34 29 46 30 C34 31 31 34 30 46 C29 34 26 31 14 30 C26 29 29 26 30 14 Z M70 46 C71.2 60 74 62.8 88 64 C74 65.2 71.2 68 70 82 C68.8 68 66 65.2 52 64 C66 62.8 68.8 60 70 46 Z M34 64 C34.6 71 36 72.4 43 73 C36 73.6 34.6 75 34 82 C33.4 75 32 73.6 25 73 C32 72.4 33.4 71 34 64 Z",
  };
  return (
    <svg className={`kit kit--${shape} ${className}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d={d[shape]} fillRule="evenodd" fill="currentColor" />
    </svg>
  );
}
