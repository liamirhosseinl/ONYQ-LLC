"use client";

/**
 * Motion gate shared by all scroll choreography.
 *
 * An inline script (MotionBootstrap) sets <html data-motion="full"> before first paint when
 * the visitor allows motion, so the tall pinned layout is in place without a jump. If the
 * client bundle then fails to start within a few seconds, the script removes the flag and
 * every story falls back to plain, readable flow — content is never hidden behind a broken
 * animation.
 */
declare global {
  interface Window {
    __onyqMotionReady?: boolean;
  }
}

export function motionAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const root = document.documentElement;
  // The watchdog gave up while the bundle was still loading; now that it runs, switch motion back on.
  if (root.dataset.motionFallback) {
    delete root.dataset.motionFallback;
    delete root.dataset.revealAll;
    root.dataset.motion = "full";
    window.__onyqMotionReady = true;
  }
  return root.dataset.motion === "full";
}

export function markMotionReady() {
  if (typeof window !== "undefined") window.__onyqMotionReady = true;
}
