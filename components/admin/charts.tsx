"use client";

import { useId, useMemo, useState } from "react";

/**
 * Hand-built SVG charts for the admin panel (no chart library, no external requests).
 * - AreaChart: one or two series over time, crosshair + tooltip on hover/focus.
 * - Columns: grouped columns (e.g. revenue vs expenses per month) with a tooltip.
 * Colours: --chart-1 / --chart-2 (validated for both themes in app/admin/admin.css).
 */

type Series = { name: string; values: number[]; color?: "1" | "2" };
type Fmt = "number" | "usd";

const FORMATS: Record<Fmt, (n: number) => string> = {
  number: (n) => Math.round(n).toLocaleString("en-US"),
  usd: (n) => (n >= 10000 ? `$${Math.round(n / 1000)}k` : n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`),
};

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export function AreaChart({ labels, series, height = 240, unit = "number" }: { labels: string[]; series: Series[]; height?: number; unit?: Fmt }) {
  const format = FORMATS[unit];
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const W = 800;
  const H = height;
  const pad = { l: 44, r: 12, t: 14, b: 28 };
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const n = labels.length;
  const x = (i: number) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.ceil(n / 8);

  const paths = useMemo(
    () =>
      series.map((s) => {
        const pts = s.values.map((v, i) => [x(i), y(v)] as const);
        const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
        const area = `${line} L${x(n - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
        return { line, area };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, max, n],
  );

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div className="a-chart">
      {series.length > 1 ? (
        <div className="a-legend">
          {series.map((s, i) => (
            <span key={s.name}>
              <i className={`a-legend__dot a-legend__dot--${s.color ?? String(i + 1)}`} />
              {s.name}
            </span>
          ))}
        </div>
      ) : null}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="a-chart__svg"
        role="img"
        aria-label={`${series.map((s) => s.name).join(" and ")} over time`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? -1) + 1));
          if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n) - 1));
        }}
        onBlur={() => setHover(null)}
      >
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.name} id={`${id}-g${i}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" className={`a-chart__stop a-chart__stop--${s.color ?? String(i + 1)}`} stopOpacity="0.28" />
              <stop offset="100%" className={`a-chart__stop a-chart__stop--${s.color ?? String(i + 1)}`} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="a-chart__grid" />
            <text x={pad.l - 8} y={y(t) + 4} className="a-chart__tick" textAnchor="end">
              {format(t)}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          (i % labelEvery === 0 && n - 1 - i >= labelEvery / 2) || i === n - 1 ? (
            <text key={l + i} x={x(i)} y={H - 8} className="a-chart__tick" textAnchor="middle">
              {l}
            </text>
          ) : null,
        )}
        {paths.map((p, i) => (
          <g key={series[i].name}>
            <path d={p.area} fill={`url(#${id}-g${i})`} />
            <path d={p.line} className={`a-chart__line a-chart__line--${series[i].color ?? String(i + 1)}`} />
          </g>
        ))}
        {hover !== null ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} className="a-chart__cross" />
            {series.map((s, i) => (
              <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r="5" className={`a-chart__dot a-chart__dot--${s.color ?? String(i + 1)}`} />
            ))}
          </g>
        ) : null}
      </svg>
      {hover !== null ? (
        <div className="a-tooltip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <p className="a-tooltip__title">{labels[hover]}</p>
          {series.map((s, i) => (
            <p key={s.name}>
              <i className={`a-legend__dot a-legend__dot--${s.color ?? String(i + 1)}`} />
              {s.name} <b>{format(s.values[hover])}</b>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Columns({ labels, series, height = 240, unit = "number" }: { labels: string[]; series: Series[]; height?: number; unit?: Fmt }) {
  const format = FORMATS[unit];
  const [hover, setHover] = useState<number | null>(null);
  const W = 800;
  const H = height;
  const pad = { l: 52, r: 8, t: 14, b: 28 };
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const n = labels.length;
  const band = (W - pad.l - pad.r) / n;
  const gap = 2;
  const barW = Math.min(26, (band * 0.7 - gap * (series.length - 1)) / series.length);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = [0, 0.5, 1].map((t) => t * max);
  return (
    <div className="a-chart">
      {series.length > 1 ? (
        <div className="a-legend">
          {series.map((s, i) => (
            <span key={s.name}>
              <i className={`a-legend__dot a-legend__dot--${s.color ?? String(i + 1)}`} />
              {s.name}
            </span>
          ))}
        </div>
      ) : null}
      <svg viewBox={`0 0 ${W} ${H}`} className="a-chart__svg" role="img" aria-label={series.map((s) => s.name).join(" and ")} onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="a-chart__grid" />
            <text x={pad.l - 8} y={y(t) + 4} className="a-chart__tick" textAnchor="end">
              {format(t)}
            </text>
          </g>
        ))}
        {labels.map((l, i) => {
          const cx = pad.l + band * i + band / 2;
          const groupW = series.length * barW + (series.length - 1) * gap;
          return (
            <g key={l} onPointerEnter={() => setHover(i)}>
              <rect x={pad.l + band * i} y={pad.t} width={band} height={H - pad.t - pad.b} className="a-chart__hit" />
              {series.map((s, k) => {
                const v = s.values[i];
                const top = y(v);
                const h = Math.max(0, y(0) - top);
                const bx = cx - groupW / 2 + k * (barW + gap);
                const r = Math.min(4, h, barW / 2);
                return (
                  <path
                    key={s.name}
                    className={`a-chart__bar a-chart__bar--${s.color ?? String(k + 1)}${hover === i ? " is-hover" : ""}`}
                    d={h > 0 ? `M${bx} ${y(0)} V${top + r} Q${bx} ${top} ${bx + r} ${top} H${bx + barW - r} Q${bx + barW} ${top} ${bx + barW} ${top + r} V${y(0)} Z` : ""}
                  />
                );
              })}
              <text x={cx} y={H - 8} className="a-chart__tick" textAnchor="middle">
                {l}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null ? (
        <div className="a-tooltip" style={{ left: `${((pad.l + band * hover + band / 2) / W) * 100}%` }}>
          <p className="a-tooltip__title">{labels[hover]}</p>
          {series.map((s, i) => (
            <p key={s.name}>
              <i className={`a-legend__dot a-legend__dot--${s.color ?? String(i + 1)}`} />
              {s.name} <b>{format(s.values[hover])}</b>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
