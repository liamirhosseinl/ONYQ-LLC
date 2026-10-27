"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { motionAllowed } from "./motion-env.ts";
import { SPARK, STONE } from "@/components/ui/brand-geometry.ts";

let hasMounted = false;

/**
 * Route curtain + first-visit intro (app/[locale]/template.tsx re-mounts it on every
 * navigation).
 *  - First visit in a session: the stone draws in, the spark ignites, a counter runs to 100,
 *    then the curtain lifts. (Set up before paint by MotionBootstrap via html[data-intro].)
 *  - Each later navigation: the forest curtain covers the old page and lifts off the new one.
 * The curtain never takes pointer events, and without JS / with reduced motion it is not shown.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const curtain = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = curtain.current;
    const root = document.documentElement;
    const first = !hasMounted;
    hasMounted = true;
    if (!el) return;
    if (!motionAllowed()) {
      delete root.dataset.intro;
      return;
    }

    const intro = first && root.dataset.intro === "play";
    if (first && !intro) return;

    el.dataset.active = "true";
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          el.dataset.active = "false";
          if (intro) {
            delete root.dataset.intro;
            try {
              sessionStorage.setItem("onyq.intro", "1");
            } catch {}
          }
        },
      });
      if (intro) {
        const counter = el.querySelector<HTMLElement>(".curtain__count");
        const obj = { v: 0 };
        tl.fromTo(".curtain__stone", { scale: 0.4, opacity: 0, rotate: -90 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.9, ease: "expo.out" }, 0)
          .fromTo(".curtain__spark", { scale: 0, rotate: -180 }, { scale: 1, rotate: 0, duration: 0.9, ease: "back.out(1.8)" }, 0.35)
          .fromTo(".curtain__glow", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 1, ease: "power2.out" }, 0.4)
          .to(obj, { v: 100, duration: 1.1, ease: "power2.inOut", onUpdate: () => counter && (counter.textContent = String(Math.round(obj.v)).padStart(3, "0")) }, 0)
          .to(".curtain__mark", { scale: 1.6, opacity: 0, duration: 0.6, ease: "power3.in" }, 1.15)
          .to(".curtain__meta", { opacity: 0, y: 10, duration: 0.3 }, 1.1)
          .fromTo(el, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.9, ease: "expo.inOut" }, 1.3);
      } else {
        gsap.set(".curtain__meta", { opacity: 0 });
        tl.fromTo(".curtain__mark", { scale: 0.7, rotate: -45, opacity: 1 }, { scale: 1.2, rotate: 45, opacity: 0, duration: 0.7, ease: "power2.out" }, 0)
          .fromTo(el, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.8, ease: "expo.inOut" }, 0.12);
      }
    }, el);
    return () => {
      ctx.revert();
      el.dataset.active = "false";
    };
  }, []);

  return (
    <>
      <div ref={curtain} className="curtain" aria-hidden="true" data-active="false">
        <div className="curtain__glow" />
        <svg className="curtain__mark" viewBox="0 0 100 100" focusable="false">
          <path className="curtain__stone" fillRule="evenodd" d={STONE} />
          <path className="curtain__spark" d={SPARK} />
        </svg>
        <div className="curtain__meta">
          <span>onyq</span>
          <span className="curtain__count">000</span>
        </div>
      </div>
      <div className="page-enter">{children}</div>
    </>
  );
}
