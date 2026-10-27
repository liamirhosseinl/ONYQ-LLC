"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { markMotionReady, motionAllowed } from "./motion-env.ts";
import { formatNumber } from "@/lib/format.ts";

gsap.registerPlugin(ScrollTrigger);

/**
 * Site-wide motion layer. Components only declare intent with attributes; this director
 * binds behaviour to whatever is in the DOM (including content that mounts later):
 *
 *   .split                 masked word rise (CSS), triggered when it enters the viewport
 *   [data-reveal]          up | fade | scale | clip | left | right | blur  (CSS transitions)
 *   [data-reveal-stagger]  children revealed in sequence (--ri index set here)
 *   [data-parallax="0.2"]  vertical drift while scrolling (GSAP scrub)
 *   [data-rotate="40"]     rotation while scrolling (GSAP scrub)
 *   [data-count]           number counts up to its server-rendered value
 *   [data-magnetic]        pulls toward the pointer (fine pointers only)
 *   [data-tilt]            3-D tilt + spotlight following the pointer (fine pointers only)
 *
 * Also: Lenis smooth scrolling (wheel only; native on touch), a scroll-velocity variable
 * (--velocity) for skewing marquees, and ScrollTrigger refreshes when layout changes.
 * Reduced motion / motion not allowed: everything renders in its final state.
 */

const REVEAL_SELECTOR = ".split, [data-reveal], [data-reveal-stagger], [data-count]";

let lenis: Lenis | null = null;

export function getLenis() {
  return lenis;
}

export function MotionDirector() {
  const pathname = usePathname();
  const firstRoute = useRef(true);

  // Global, once: Lenis + velocity + IO-driven reveals + pointer effects.
  useEffect(() => {
    markMotionReady();
    const root = document.documentElement;
    if (!motionAllowed()) {
      root.dataset.revealAll = "true";
      return;
    }

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const automated = navigator.webdriver === true;

    // Smooth wheel scrolling. Disabled for automated browsers so tests scroll deterministically.
    if (fine && !automated) {
      lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, anchors: { offset: -96 }, autoRaf: false, prevent: (node) => node.closest?.("[data-lenis-prevent], dialog, .drawer, .menu-panel") !== null });
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      root.classList.add("lenis-on");
    }

    // Stop smooth scrolling while a dialog/drawer locks the page.
    const lockObserver = new MutationObserver(() => {
      if (!lenis) return;
      if (document.body.dataset.scrollLock === "true") lenis.stop();
      else lenis.start();
    });
    lockObserver.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-lock"] });

    // Scroll velocity → CSS (marquee skew, etc.).
    let vel = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    const velTick = () => {
      const now = performance.now();
      const y = window.scrollY;
      const dt = Math.max(16, now - lastT);
      const v = ((y - lastY) / dt) * 16;
      vel += (v - vel) * 0.18;
      if (Math.abs(vel) < 0.01) vel = 0;
      root.style.setProperty("--velocity", Math.max(-40, Math.min(40, vel)).toFixed(2));
      lastY = y;
      lastT = now;
    };
    gsap.ticker.add(velTick);

    // Reveals.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.dataset.inview = "true";
          io.unobserve(el);
          if (el.hasAttribute("data-count")) countUp(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    // Per-effect registry (a dataset flag would survive React's dev double-mount and leave
    // elements unobserved by the second observer).
    const bound = new WeakSet<Element>();
    const bind = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
        if (bound.has(el)) return;
        bound.add(el);
        if (el.hasAttribute("data-reveal-stagger")) {
          Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty("--ri", String(i)));
        }
        // Words inside pinned stories are driven by the story stage, not the viewport.
        if (el.classList.contains("split") && el.closest(".story__panel")) return;
        io.observe(el);
      });
      if (fine) {
        scope.querySelectorAll<HTMLElement>("[data-magnetic]").forEach(bindMagnetic);
        scope.querySelectorAll<HTMLElement>("[data-tilt]").forEach(bindTilt);
      }
    };
    bind(document);

    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (n.nodeType === 1) bind(n as Element);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Layout settles after fonts and images.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener("load", refresh);
    const ro = new ResizeObserver(() => ScrollTrigger.refresh());
    ro.observe(document.body);

    return () => {
      io.disconnect();
      mo.disconnect();
      lockObserver.disconnect();
      ro.disconnect();
      gsap.ticker.remove(velTick);
      window.removeEventListener("load", refresh);
      lenis?.destroy();
      lenis = null;
      root.classList.remove("lenis-on");
    };
  }, []);

  // Per route: scroll-scrubbed parallax / rotation, and scroll to top.
  useEffect(() => {
    if (!motionAllowed()) return;
    if (!firstRoute.current && !window.location.hash) lenis?.scrollTo(0, { immediate: true, force: true });
    firstRoute.current = false;
    let ctx: gsap.Context | null = null;
    const id = requestAnimationFrame(() => {
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const amt = parseFloat(el.dataset.parallax || "0.15");
          gsap.fromTo(
            el,
            { yPercent: -amt * 50 },
            {
              yPercent: amt * 50,
              ease: "none",
              scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-rotate]").forEach((el) => {
          const deg = parseFloat(el.dataset.rotate || "45");
          gsap.fromTo(
            el,
            { rotate: -deg / 2 },
            {
              rotate: deg / 2,
              ease: "none",
              scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: 0.6 },
            },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-scale-in]").forEach((el) => {
          gsap.fromTo(
            el,
            { scale: parseFloat(el.dataset.scaleIn || "0.88"), borderRadius: "48px" },
            {
              scale: 1,
              borderRadius: "28px",
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "top 35%", scrub: 0.5 },
            },
          );
        });
      });
      ScrollTrigger.refresh();
    });
    return () => {
      cancelAnimationFrame(id);
      ctx?.revert();
    };
  }, [pathname]);

  return null;
}

function countUp(el: HTMLElement) {
  const target = parseFloat(el.dataset.count || "0");
  if (!Number.isFinite(target)) return;
  const lang = document.documentElement.lang || "en";
  const fmt = { format: (n: number) => formatNumber(n, lang) };
  const prefix = el.dataset.countPrefix ?? "";
  const suffix = el.dataset.countSuffix ?? "";
  const final = el.textContent;
  const obj = { v: 0 };
  gsap.to(obj, {
    v: target,
    duration: 2.2,
    ease: "expo.out",
    onUpdate: () => {
      el.textContent = `${prefix}${fmt.format(Math.round(obj.v))}${suffix}`;
    },
    onComplete: () => {
      el.textContent = final;
    },
  });
}

function bindMagnetic(el: HTMLElement) {
  if (el.dataset.magneticBound) return;
  el.dataset.magneticBound = "1";
  const strength = parseFloat(el.dataset.magnetic || "") || 0.32;
  const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
  const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    xTo((e.clientX - (r.left + r.width / 2)) * strength);
    yTo((e.clientY - (r.top + r.height / 2)) * strength);
  });
  el.addEventListener("pointerleave", () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
  });
}

function bindTilt(el: HTMLElement) {
  if (el.dataset.tiltBound) return;
  el.dataset.tiltBound = "1";
  const max = parseFloat(el.dataset.tilt || "") || 6;
  let frame = 0;
  el.addEventListener("pointermove", (e) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      el.style.setProperty("--rx", `${((0.5 - py) * max).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((px - 0.5) * max).toFixed(2)}deg`);
      el.dataset.hover = "true";
    });
  });
  el.addEventListener("pointerleave", () => {
    cancelAnimationFrame(frame);
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.dataset.hover = "false";
  });
}
