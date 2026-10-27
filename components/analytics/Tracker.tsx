"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * First-party, cookieless page analytics (see lib/server/analytics.ts).
 * Sends a page view on every route change and, when the visitor leaves the page, how long it
 * was actually visible and how far it was scrolled. Nothing is sent by automated browsers or
 * when the browser signals Global Privacy Control.
 */
let sessionId = "";

function sid() {
  if (sessionId) return sessionId;
  try {
    sessionId = sessionStorage.getItem("onyq.sid") || "";
    if (!sessionId) {
      sessionId = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 20);
      sessionStorage.setItem("onyq.sid", sessionId);
    }
  } catch {
    sessionId ||= Math.random().toString(36).slice(2, 14);
  }
  return sessionId;
}

function blocked() {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  return n.webdriver === true || n.globalPrivacyControl === true;
}

function send(payload: Record<string, unknown>) {
  if (typeof window === "undefined" || blocked()) return;
  const body = JSON.stringify({ ...payload, s: sid() });
  try {
    if (navigator.sendBeacon?.("/api/a", new Blob([body], { type: "application/json" }))) return;
  } catch {}
  fetch("/api/a", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
}

/** Record a named event, e.g. track("brief_open", { from: "header" }). */
export function track(name: string, meta?: Record<string, string | number>) {
  send({ t: "ev", n: name, p: location.pathname, m: meta });
}

export function Tracker() {
  const pathname = usePathname();
  const state = useRef({ path: "", visibleMs: 0, since: 0, scroll: 0 });

  useEffect(() => {
    const st = state.current;
    const flush = () => {
      if (!st.path) return;
      const d = st.visibleMs + (document.visibilityState === "visible" && st.since ? performance.now() - st.since : 0);
      send({ t: "leave", p: st.path, d: Math.round(d), sc: Math.round(st.scroll) });
    };
    // Close the previous page, open the new one.
    flush();
    const params = new URLSearchParams(location.search);
    st.path = pathname;
    st.visibleMs = 0;
    st.scroll = 0;
    st.since = document.visibilityState === "visible" ? performance.now() : 0;
    send({
      t: "pv",
      p: pathname,
      l: document.documentElement.lang,
      r: document.referrer || undefined,
      us: params.get("utm_source") || undefined,
      um: params.get("utm_medium") || undefined,
      uc: params.get("utm_campaign") || undefined,
      w: window.innerWidth,
    });

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0) st.scroll = Math.max(st.scroll, Math.min(100, (window.scrollY / max) * 100));
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        if (st.since) st.visibleMs += performance.now() - st.since;
        st.since = 0;
        flush();
      } else {
        st.since = performance.now();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
      if (st.since) st.visibleMs += performance.now() - st.since;
      st.since = performance.now();
    };
  }, [pathname]);

  return null;
}
