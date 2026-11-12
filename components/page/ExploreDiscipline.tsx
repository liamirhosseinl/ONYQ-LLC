"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/**
 * "How the result comes together" + "Explore this discipline" (reference direction pages):
 * an approach card on the left and a tab list on the right; choosing a tab swaps the text
 * and highlights its layer in the card. Proper tabs pattern with arrow-key support.
 *
 * With `scenes`, the card shows one animated scene per tab instead of the brand art (used on
 * /how-we-work): the scenes react to `.explore[data-active]` (styles/journey.css), and the
 * tabs advance on their own while the card is in view, until the visitor picks one.
 */
export function ExploreDiscipline({
  kicker,
  flow,
  labels,
  areas,
  art,
  exploreLabel,
  caption,
  panelLabel,
  scenes,
}: {
  kicker: string;
  flow: string;
  labels: [string, string, string];
  areas: { title: string; body: string }[];
  art: ReactNode;
  exploreLabel: string;
  caption: string;
  panelLabel: string;
  scenes?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(Boolean(scenes));
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);

  // Autoplay (scenes only): advance every few seconds while visible; stop for good on any
  // interaction, and never run for visitors who prefer reduced motion.
  useEffect(() => {
    if (!auto || !root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAuto(false);
      return;
    }
    let timer: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        clearInterval(timer);
        if (entry.isIntersecting) timer = setInterval(() => setActive((a) => (a + 1) % areas.length), 4800);
      },
      { threshold: 0.45 },
    );
    io.observe(root.current);
    return () => {
      io.disconnect();
      clearInterval(timer);
    };
  }, [auto, areas.length]);

  const pick = (i: number) => {
    setAuto(false);
    setActive(i);
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = i;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % areas.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + areas.length) % areas.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = areas.length - 1;
    else return;
    e.preventDefault();
    pick(next);
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  };

  return (
    <div
      ref={root}
      className={`explore${scenes ? " explore--scenes" : ""}`}
      data-active={active}
      data-auto={auto ? "true" : undefined}
      data-reveal="up"
      style={{ ["--steps" as string]: areas.length }}
    >
      <div className="explore__card spotlight" aria-hidden="true" data-tilt={scenes ? undefined : "3"}>
        <div className="explore__card-head mono">
          <span>{kicker}</span>
          <span>{flow}</span>
        </div>
        <div className="explore__art">{scenes ?? art}</div>
        {scenes ? (
          <ol className="explore__steps" role="list">
            {areas.map((a, i) => (
              <li key={a.title} data-on={active === i ? "true" : undefined} data-done={i < active ? "true" : undefined}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span> {a.title}
                <i />
              </li>
            ))}
          </ol>
        ) : (
          <ol className="explore__layers" role="list">
            {labels.map((l, i) => (
              <li key={l} data-on={active % labels.length === i ? "true" : undefined}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span> {l}
              </li>
            ))}
          </ol>
        )}
        <p className="explore__caption mono">{caption}</p>
      </div>

      <div className="explore__side">
        <p className="eyebrow eyebrow--muted">{exploreLabel}</p>
        <div role="tablist" aria-orientation="vertical" aria-label={exploreLabel} className="explore__tabs">
          {areas.map((a, i) => (
            <button
              key={a.title}
              id={`${uid}-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={active === i}
              aria-controls={`${uid}-panel`}
              tabIndex={active === i ? 0 : -1}
              className="explore__tab"
              onClick={() => pick(i)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <span>{a.title}</span>
            </button>
          ))}
        </div>
        <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${active}`} className="explore__panel" aria-live="polite">
          <p className="mono">
            {panelLabel} / {String(active + 1).padStart(2, "0")}
          </p>
          <p className="explore__text" key={active}>
            {areas[active].body}
          </p>
        </div>
      </div>
    </div>
  );
}
