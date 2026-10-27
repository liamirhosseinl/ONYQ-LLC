import type { ReactNode } from "react";
import Link from "next/link";

/* Small, server-rendered building blocks of the admin panel (styles: app/admin/admin.css). */

export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="a-head">
      <div>
        <h1 className="a-head__title">{title}</h1>
        {sub ? <p className="a-head__sub">{sub}</p> : null}
      </div>
      {actions ? <div className="a-head__actions">{actions}</div> : null}
    </header>
  );
}

export function Card({ title, action, children, className = "", pad = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`a-card ${pad ? "" : "a-card--flush"} ${className}`}>
      {title || action ? (
        <div className="a-card__head">
          {title ? <h2 className="a-card__title">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Kpi({ label, value, delta, hint, accent = false }: { label: string; value: ReactNode; delta?: number | null; hint?: ReactNode; accent?: boolean }) {
  return (
    <div className={`a-kpi${accent ? " a-kpi--accent" : ""}`}>
      <p className="a-kpi__label">{label}</p>
      <p className="a-kpi__value">{value}</p>
      <p className="a-kpi__foot">
        {delta === undefined ? null : delta === null ? (
          <span className="a-delta a-delta--new">new</span>
        ) : (
          <span className={`a-delta ${delta > 0.5 ? "a-delta--up" : delta < -0.5 ? "a-delta--down" : ""}`}>
            {delta > 0.5 ? "▲" : delta < -0.5 ? "▼" : "•"} {Math.abs(delta).toFixed(0)}%
          </span>
        )}
        {hint ? <span className="a-kpi__hint">{hint}</span> : null}
      </p>
    </div>
  );
}

const TONE: Record<string, string> = {
  new: "info",
  contacted: "warn",
  qualified: "accent",
  converted: "good",
  spam: "bad",
  archived: "muted",
  prospect: "info",
  active: "good",
  paused: "warn",
  past: "muted",
  discovery: "info",
  proposal: "warn",
  negotiation: "accent",
  won: "good",
  lost: "bad",
  draft: "muted",
  sent: "info",
  paid: "good",
  partial: "warn",
  overdue: "bad",
  void: "muted",
  high: "bad",
  normal: "info",
  low: "muted",
  owner: "accent",
  admin: "accent",
  manager: "info",
  viewer: "muted",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return <span className={`a-badge a-badge--${TONE[value] ?? "muted"}`}>{label ?? value}</span>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="a-empty">
      <svg viewBox="24 24 52 52" aria-hidden="true">
        <path d="M50 24 C51.6 41 59 48.4 76 50 C59 51.6 51.6 59 50 76 C48.4 59 41 51.6 24 50 C41 48.4 48.4 41 50 24 Z" />
      </svg>
      <p className="a-empty__title">{title}</p>
      {children ? <div className="a-empty__body">{children}</div> : null}
    </div>
  );
}

export function Tabs({ items, current }: { items: { href: string; label: string; count?: number; key: string }[]; current: string }) {
  return (
    <nav className="a-tabs" aria-label="Filter">
      {items.map((i) => (
        <Link key={i.key} href={i.href} className="a-tabs__item" aria-current={i.key === current ? "page" : undefined}>
          {i.label}
          {i.count !== undefined ? <span className="a-tabs__count">{i.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

export function BarList({ rows, total, format = (n: number) => String(n), empty = "No data yet" }: { rows: { key: string; value: number; hint?: string; href?: string }[]; total?: number; format?: (n: number) => string; empty?: string }) {
  if (!rows.length) return <p className="a-muted a-pad">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ol className="a-barlist">
      {rows.map((r) => (
        <li key={r.key} className="a-barlist__row">
          <span className="a-barlist__bar" style={{ width: `${(r.value / max) * 100}%` }} aria-hidden="true" />
          <span className="a-barlist__key" title={r.key}>
            {r.href ? <Link href={r.href}>{r.key}</Link> : r.key}
          </span>
          <span className="a-barlist__hint">{r.hint}</span>
          <span className="a-barlist__value">
            {format(r.value)}
            {total ? <em> {((r.value / total) * 100).toFixed(0)}%</em> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ───────── Formatting ───────── */

export const usd = (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
export const money = (n: number, cur: string) =>
  cur === "USD" ? usd(n) : `${Math.round(n).toLocaleString("en-US")} ${cur === "AMD" ? "֏" : cur === "EUR" ? "€" : cur === "RUB" ? "₽" : cur}`;
export const num = (n: number) => Math.round(n).toLocaleString("en-US");
export const dur = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};
export const date = (ts: number | string | null) => {
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts) : new Date(`${ts}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Yerevan" });
};
export const dateTime = (ts: number) =>
  new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Yerevan" });
export const ago = (ts: number) => {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`;
  return date(ts);
};
export const todayIso = () => new Date().toISOString().slice(0, 10);
export const inDays = (n: number) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10);

const FLAGS = (cc: string) => (/^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "🌐");
export function country(cc: string | null) {
  if (!cc || cc === "Unknown") return "Unknown";
  let name = cc;
  try {
    name = new Intl.DisplayNames(["en"], { type: "region" }).of(cc) ?? cc;
  } catch {}
  return `${FLAGS(cc)} ${name}`;
}

export function pctChangeLabel(now: number, before: number) {
  if (!before) return now ? "first month with revenue" : "—";
  const p = ((now - before) / before) * 100;
  return `${p >= 0 ? "▲" : "▼"} ${Math.abs(p).toFixed(0)}% vs last month`;
}
