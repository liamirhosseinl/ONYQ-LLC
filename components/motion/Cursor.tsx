"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { motionAllowed } from "./motion-env.ts";
import { SPARK } from "@/components/ui/brand-geometry.ts";

/**
 * Pointer companion (fine pointers only): a small volt spark that trails just below and to
 * the right of the pointer with a little inertia, tilting with the direction of travel.
 * Over links and buttons it brightens and turns a quarter. The native cursor stays visible —
 * this is decoration, never a replacement.
 */
export function Cursor() {
  const spark = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = spark.current;
    if (!s) return;
    if (!motionAllowed() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.dataset.cursor = "on";

    const OFFSET = 16;
    const sx = gsap.quickTo(s, "x", { duration: 0.42, ease: "power3" });
    const sy = gsap.quickTo(s, "y", { duration: 0.42, ease: "power3" });
    const rot = gsap.quickTo(s, "rotate", { duration: 0.6, ease: "power3" });

    let shown = false;
    let lastX = 0;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const x = e.clientX + OFFSET;
      const y = e.clientY + OFFSET;
      if (!shown) {
        shown = true;
        gsap.set(s, { x, y });
        document.documentElement.dataset.cursorVisible = "true";
      }
      sx(x);
      sy(y);
      rot(Math.max(-40, Math.min(40, (e.clientX - lastX) * 2.2)));
      lastX = e.clientX;
      const target = e.target as Element | null;
      const interactive = target?.closest?.("a, button, [role='button'], label, select, summary, input, textarea, [data-cursor]");
      const state = interactive ? "link" : "default";
      if (s.dataset.state !== state) s.dataset.state = state;
    };
    const leave = () => {
      shown = false;
      delete document.documentElement.dataset.cursorVisible;
    };
    const down = () => s.classList.add("is-down");
    const up = () => s.classList.remove("is-down");

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      delete document.documentElement.dataset.cursor;
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <div ref={spark} className="cursor__spark" data-state="default">
        <svg viewBox="24 24 52 52">
          <path d={SPARK} />
        </svg>
      </div>
    </div>
  );
}
