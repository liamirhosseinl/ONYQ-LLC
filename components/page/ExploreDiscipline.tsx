"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

/**
 * "How the result comes together" + "Explore this discipline" (reference direction pages):
 * an approach card on the left and a tab list on the right; choosing a tab swaps the text
 * and highlights its layer in the card. Proper tabs pattern with arrow-key support.
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
}: {
  kicker: string;
  flow: string;
  labels: [string, string, string];
  areas: { title: string; body: string }[];
  art: ReactNode;
  exploreLabel: string;
  caption: string;
  panelLabel: string;
}) {
  const [active, setActive] = useState(0);
  const uid = useId();

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = i;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % areas.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + areas.length) % areas.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = areas.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  };

  return (
    <div className="explore" data-active={active} data-reveal="up">
      <div className="explore__card spotlight" aria-hidden="true" data-tilt="3">
        <div className="explore__card-head mono">
          <span>{kicker}</span>
          <span>{flow}</span>
        </div>
        <div className="explore__art">{art}</div>
        <ol className="explore__layers" role="list">
          {labels.map((l, i) => (
            <li key={l} data-on={active % labels.length === i ? "true" : undefined}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span> {l}
            </li>
          ))}
        </ol>
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
              onClick={() => setActive(i)}
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
