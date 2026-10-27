"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";

type Theme = "light" | "dark";
const KEY = "onyq.theme";
const THEME_COLOR: Record<Theme, string> = { dark: "#14332F", light: "#EEEEE9" };

function current(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    m.content = THEME_COLOR[theme];
    m.removeAttribute("media");
  });
  window.dispatchEvent(new CustomEvent("onyq:theme", { detail: theme }));
}

/**
 * Day / night switch (brand book: "morning mist" and "forest"). The choice is remembered per
 * browser; until the visitor chooses, the system preference is followed live. Where the
 * View Transitions API exists, the new theme grows out of the button as a circle.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const t = useTranslations("theme");
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(current());
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onSystem = () => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(KEY);
      } catch {}
      if (saved === "light" || saved === "dark") return;
      const next: Theme = mq.matches ? "light" : "dark";
      apply(next);
      setTheme(next);
    };
    const onExternal = (e: Event) => setTheme((e as CustomEvent<Theme>).detail);
    mq.addEventListener("change", onSystem);
    window.addEventListener("onyq:theme", onExternal);
    return () => {
      mq.removeEventListener("change", onSystem);
      window.removeEventListener("onyq:theme", onExternal);
    };
  }, []);

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce) {
      apply(next);
      setTheme(next);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.documentElement.dataset.themeSwitching = "true";
    const vt = doc.startViewTransition(() => {
      apply(next);
      setTheme(next);
    });
    vt.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 720, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => delete document.documentElement.dataset.themeSwitching, 760);
      });
  };

  const isDark = theme !== "light";
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggle}
      aria-label={isDark ? t("toLight") : t("toDark")}
      title={isDark ? t("toLight") : t("toDark")}
      data-theme-state={theme ?? "unknown"}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <mask id="theme-toggle-moon">
          <rect x="0" y="0" width="24" height="24" fill="#fff" />
          <circle className="theme-toggle__bite" cx="18" cy="6" r="7" fill="#000" />
        </mask>
        <circle className="theme-toggle__core" cx="12" cy="12" r="5.2" fill="currentColor" mask="url(#theme-toggle-moon)" />
        <g className="theme-toggle__rays" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <path d="M12 1.8v2.2M12 20v2.2M1.8 12h2.2M20 12h2.2M4.8 4.8l1.5 1.5M17.7 17.7l1.5 1.5M4.8 19.2l1.5-1.5M17.7 6.3l1.5-1.5" />
        </g>
      </svg>
    </button>
  );
}
