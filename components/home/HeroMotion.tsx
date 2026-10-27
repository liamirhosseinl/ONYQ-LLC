"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { markMotionReady, motionAllowed } from "@/components/motion/motion-env.ts";

gsap.registerPlugin(ScrollTrigger);

/**
 * Hero choreography:
 *  1. load (after the first-visit intro, if it plays): the stone rises and turns into place,
 *     the spark ignites, rings ripple out, copy and actions follow; headline words rise (CSS);
 *  2. pointer: scene layers drift at different depths (fine pointers);
 *  3. scroll: the sticky scene recedes — the stone grows and turns, copy lifts away (--hp).
 * Reduced motion / no JS: static composition, nothing hidden.
 */
export function HeroMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    markMotionReady();
    if (!motionAllowed()) {
      el.dataset.intro = "done";
      return;
    }
    const delay = document.documentElement.dataset.intro === "play" ? 1.45 : 0.15;
    el.style.setProperty("--split-delay", `${Math.round(delay * 1000)}ms`);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        delay,
        defaults: { ease: "expo.out", clearProps: "opacity,transform,scale,rotate,y" },
        onComplete: () => {
          el.dataset.intro = "done";
        },
      });
      tl.fromTo(".hero__picture", { scale: 1.16, opacity: 0, filter: "blur(14px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 2.6, ease: "power3.out", clearProps: "opacity,transform,scale,filter" }, 0)
        .fromTo(".scene__spark", { scale: 0, rotate: -180, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 1.8, ease: "back.out(1.7)" }, 0.9)
        .fromTo(".hero__reveal", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.08 }, 0.55)
        .fromTo(".hero__foot", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, 0.9);

      // Scroll recede.
      gsap.to(el, {
        "--hp": 1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });
    }, el);

    // Pointer parallax on the scene layers.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const layers = Array.from(el.querySelectorAll<HTMLElement>(".hero__layer"));
    const movers = layers.map((layer) => ({
      depth: parseFloat(layer.dataset.depth || "0.5"),
      x: gsap.quickTo(layer, "x", { duration: 1.2, ease: "power3.out" }),
      y: gsap.quickTo(layer, "y", { duration: 1.2, ease: "power3.out" }),
    }));
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      movers.forEach((m) => {
        m.x(nx * 46 * m.depth);
        m.y(ny * 34 * m.depth);
      });
      el.style.setProperty("--px", nx.toFixed(3));
      el.style.setProperty("--py", ny.toFixed(3));
    };
    if (fine) el.addEventListener("pointermove", onMove);

    return () => {
      ctx.revert();
      if (fine) el.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section ref={root} className="hero" aria-labelledby="hero-title" data-intro="pending">
      {children}
    </section>
  );
}
