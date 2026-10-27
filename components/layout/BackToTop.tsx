"use client";

import { ArrowUpRight } from "@/components/ui/icons.tsx";
import { getLenis } from "@/components/motion/MotionDirector.tsx";

export function BackToTop({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="back-top"
      data-magnetic="0.3"
      onClick={() => {
        const lenis = getLenis();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (lenis) lenis.scrollTo(0, { duration: 1.6 });
        else window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        document.getElementById("main")?.focus({ preventScroll: true });
      }}
    >
      {label}
      <span className="back-top__icon" aria-hidden="true">
        <ArrowUpRight />
      </span>
    </button>
  );
}
