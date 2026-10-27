"use client";

import { useState, type KeyboardEvent } from "react";
import type { HomeContent } from "@/content/types.ts";
import { useBrief } from "@/components/brief/BriefProvider.tsx";
import { ArrowUpRight, Check } from "@/components/ui/icons.tsx";
import { SplitLines } from "@/components/motion/Split.tsx";

type Mode = "separate" | "onyq";

/** Separate: cards scattered, each wired to you. ONYQ: cards gathered around one hub. */
const HUB_Y = 46;
const YOU_Y = 88;
const NODE_LAYOUT = [
  { sx: 13, sy: 22, ox: 17, oy: 30, r: -7 },
  { sx: 37, sy: 10, ox: 37, oy: 12, r: 4 },
  { sx: 63, sy: 16, ox: 63, oy: 12, r: -3 },
  { sx: 87, sy: 24, ox: 83, oy: 30, r: 6 },
  { sx: 24, sy: 50, ox: 19, oy: 62, r: 5 },
  { sx: 77, sy: 52, ox: 81, oy: 62, r: -6 },
];

/**
 * Interactive two-model comparison (reference: "Separate contractors / One team" control).
 * A real segmented control — keyboard (Tab + Enter/Space, arrow keys), mouse and touch.
 * Claims are qualitative only; no savings figures.
 */
export function ValueComparison({ copy }: { copy: HomeContent["value"] }) {
  const [mode, setMode] = useState<Mode>("separate");
  const { open } = useBrief();
  const modes: Mode[] = ["separate", "onyq"];

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = mode === "separate" ? "onyq" : "separate";
      setMode(next);
      (document.getElementById(`value-mode-${next}`) as HTMLButtonElement | null)?.focus();
    }
  };

  return (
    <section className="value section" aria-labelledby="value-title" data-mode={mode}>
      <div className="wrap">
        <p className="eyebrow" data-reveal="up">
          <span className="eyebrow__dot" aria-hidden="true" />
          {copy.label}
        </p>
        <div className="value__head">
          <h2 id="value-title" className="t-h1">
            <SplitLines lines={copy.title} />
          </h2>
          <p className="t-lead" data-reveal="up">
            {copy.lead}
          </p>
        </div>

        <div className="value__grid" data-reveal="up">
          <div className="value__diagram">
            <div className="segmented segmented--dark value__switch" role="group" aria-label={copy.compareHint} onKeyDown={onKey}>
              {modes.map((m) => (
                <button
                  key={m}
                  id={`value-mode-${m}`}
                  type="button"
                  className="segmented__btn"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                >
                  {copy.modes[m]}
                </button>
              ))}
            </div>

            <div className="nodes" aria-hidden="true" style={{ ["--count" as string]: copy.nodes.length }}>
              <svg viewBox="0 0 100 100" className="nodes__lines" preserveAspectRatio="none">
                {copy.nodes.map((label, i) => {
                  const p = NODE_LAYOUT[i % NODE_LAYOUT.length];
                  return (
                    <g key={label}>
                      <path className="nodes__line nodes__line--sep" d={`M${p.sx} ${p.sy} Q${(p.sx + 50) / 2} ${p.sy + 30} 50 ${YOU_Y}`} />
                      <path className="nodes__line nodes__line--hub" d={`M${p.ox} ${p.oy} L50 ${HUB_Y}`} />
                    </g>
                  );
                })}
                <path className="nodes__hub-line" d={`M50 ${HUB_Y} L50 ${YOU_Y}`} />
              </svg>
              {copy.nodes.map((label, i) => {
                const p = NODE_LAYOUT[i % NODE_LAYOUT.length];
                return (
                  <span
                    key={label}
                    className="nodes__card"
                    style={{ ["--sx" as string]: `${p.sx}%`, ["--sy" as string]: `${p.sy}%`, ["--ox" as string]: `${p.ox}%`, ["--oy" as string]: `${p.oy}%`, ["--r" as string]: `${p.r}deg`, ["--k" as string]: i }}
                  >
                    <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                    {label}
                  </span>
                );
              })}
              <span className="nodes__hub">onyq</span>
              <span className="nodes__you">
                <small>{copy.you}</small>
                <b>{mode === "separate" ? copy.nodes.length : 1}</b>
              </span>
            </div>
            <p className="value__caption" aria-live="polite">
              {copy.captions[mode]}
            </p>
          </div>

          <div className="value__rows">
            <p className="mono value__rows-head">
              <span>{copy.modes.separate}</span>
              <span>→</span>
              <span>{copy.modes.onyq}</span>
            </p>
            <ol role="list">
              {copy.rows.map((row, i) => (
                <li key={row.before} className="value__row">
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="value__pair">
                    <span className="value__before">{row.before}</span>
                    <span className="value__after">{row.after}</span>
                  </span>
                  <span className="value__check" aria-hidden="true">
                    <Check />
                  </span>
                </li>
              ))}
            </ol>
            <p className="value__summary t-h4">{copy.summary}</p>
            <button type="button" className="link-arrow" onClick={() => open()} aria-haspopup="dialog">
              {copy.cta} <ArrowUpRight />
            </button>
          </div>
        </div>
        <p className="value__disclaimer t-small">{copy.disclaimer}</p>
      </div>
    </section>
  );
}
