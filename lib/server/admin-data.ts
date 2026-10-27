import "server-only";
import { all, get } from "./db.ts";
import { today } from "./analytics.ts";
import { amdPolicy } from "@/data/currency.ts";

/* ───────── Helpers ───────── */

export type Range = { days: number; from: number; to: number; prevFrom: number; label: string };

export function rangeFrom(param: string | undefined): Range {
  const days = param === "1d" ? 1 : param === "30d" ? 30 : param === "90d" ? 90 : param === "365d" ? 365 : 7;
  const to = Date.now();
  const from = to - days * 86400_000;
  return { days, from, to, prevFrom: from - days * 86400_000, label: `${days}d` };
}

export function pctChange(now: number, before: number): number | null {
  if (!before) return now ? null : 0;
  return ((now - before) / before) * 100;
}

/** Amounts are stored in their own currency; totals are shown in USD. */
export function fxRates(): Record<string, number> {
  const row = get<{ value: string }>("SELECT value FROM settings WHERE key = 'finance.fx'");
  const base = { USD: 1, AMD: 1 / amdPolicy.ratePerUsd, EUR: 1.08, RUB: 0.011 };
  if (!row) return base;
  try {
    return { ...base, ...JSON.parse(row.value) };
  } catch {
    return base;
  }
}

export function toUsd(amount: number, currency: string, rates = fxRates()) {
  return amount * (rates[currency] ?? 1);
}

/* ───────── Analytics ───────── */

type N = { n: number };

export function trafficTotals(from: number, to: number) {
  const pv = get<N>("SELECT COUNT(*) AS n FROM pageviews WHERE ts >= ? AND ts < ?", from, to)!.n;
  const visitors = get<N>("SELECT COUNT(*) AS n FROM (SELECT DISTINCT day, visitor FROM pageviews WHERE ts >= ? AND ts < ?)", from, to)!.n;
  const sessions = get<N>("SELECT COUNT(DISTINCT session) AS n FROM pageviews WHERE ts >= ? AND ts < ?", from, to)!.n;
  const bounces = get<N>("SELECT COUNT(*) AS n FROM (SELECT session FROM pageviews WHERE ts >= ? AND ts < ? GROUP BY session HAVING COUNT(*) = 1)", from, to)!.n;
  const time = get<{ t: number | null }>("SELECT SUM(duration_ms) AS t FROM pageviews WHERE ts >= ? AND ts < ?", from, to)!.t ?? 0;
  const scroll = get<{ s: number | null }>("SELECT AVG(scroll) AS s FROM pageviews WHERE ts >= ? AND ts < ? AND duration_ms > 0", from, to)!.s ?? 0;
  return {
    pageviews: pv,
    visitors,
    sessions,
    bounceRate: sessions ? (bounces / sessions) * 100 : 0,
    avgSessionMs: sessions ? time / sessions : 0,
    viewsPerSession: sessions ? pv / sessions : 0,
    avgScroll: scroll,
  };
}

export function trafficSeries(r: Range) {
  const byDay = new Map(
    all<{ day: string; visitors: number; pageviews: number }>(
      "SELECT day, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS pageviews FROM pageviews WHERE ts >= ? AND ts < ? GROUP BY day",
      r.from,
      r.to,
    ).map((d) => [d.day, d]),
  );
  const out: { day: string; visitors: number; pageviews: number }[] = [];
  for (let i = r.days - 1; i >= 0; i--) {
    const day = today(r.to - i * 86400_000);
    out.push(byDay.get(day) ?? { day, visitors: 0, pageviews: 0 });
  }
  return out;
}

export function hourlySeries() {
  const from = Date.now() - 24 * 3600_000;
  const rows = all<{ h: number; n: number }>("SELECT CAST((ts - ?) / 3600000 AS INTEGER) AS h, COUNT(*) AS n FROM pageviews WHERE ts >= ? GROUP BY h", from, from);
  const map = new Map(rows.map((r) => [r.h, r.n]));
  return Array.from({ length: 24 }, (_, h) => ({ label: new Date(from + h * 3600_000).toISOString().slice(11, 13) + ":00", value: map.get(h) ?? 0 }));
}

export function breakdown(dim: "path" | "referrer" | "country" | "device" | "browser" | "os" | "locale" | "utm_source" | "screen", from: number, to: number, limit = 10) {
  const col = dim === "referrer" ? "COALESCE(referrer, utm_source, 'Direct / none')" : `COALESCE(${dim}, 'Unknown')`;
  return all<{ key: string; views: number; visitors: number; avg_ms: number }>(
    `SELECT ${col} AS key, COUNT(*) AS views, COUNT(DISTINCT day || visitor) AS visitors, AVG(NULLIF(duration_ms, 0)) AS avg_ms
     FROM pageviews WHERE ts >= ? AND ts < ? GROUP BY key ORDER BY visitors DESC, views DESC LIMIT ?`,
    from,
    to,
    limit,
  );
}

export function entryPages(from: number, to: number, limit = 8) {
  return all<{ key: string; sessions: number }>(
    `SELECT path AS key, COUNT(*) AS sessions FROM pageviews p
     WHERE ts >= ? AND ts < ? AND ts = (SELECT MIN(ts) FROM pageviews q WHERE q.session = p.session)
     GROUP BY path ORDER BY sessions DESC LIMIT ?`,
    from,
    to,
    limit,
  );
}

export function eventCounts(from: number, to: number) {
  return all<{ name: string; n: number; sessions: number }>(
    "SELECT name, COUNT(*) AS n, COUNT(DISTINCT session) AS sessions FROM events WHERE ts >= ? AND ts < ? GROUP BY name ORDER BY n DESC",
    from,
    to,
  );
}

export function liveVisitors() {
  return get<N>("SELECT COUNT(DISTINCT session) AS n FROM pageviews WHERE ts >= ?", Date.now() - 5 * 60_000)!.n;
}

export function livePages() {
  return all<{ key: string; n: number }>(
    "SELECT path AS key, COUNT(DISTINCT session) AS n FROM pageviews WHERE ts >= ? GROUP BY path ORDER BY n DESC LIMIT 6",
    Date.now() - 5 * 60_000,
  );
}

/** A session's path through the site, for the lead detail ("journey before the brief"). */
export function visitorJourney(visitor: string, before: number) {
  return all<{ ts: number; path: string; duration_ms: number; referrer: string | null; country: string | null; device: string | null }>(
    "SELECT ts, path, duration_ms, referrer, country, device FROM pageviews WHERE visitor = ? AND ts <= ? ORDER BY ts ASC LIMIT 40",
    visitor,
    before + 60_000,
  );
}

/* ───────── CRM ───────── */

export const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "spam", "archived"] as const;
export const CLIENT_STATUSES = ["prospect", "active", "paused", "past"] as const;
export const DEAL_STAGES = ["new", "discovery", "proposal", "negotiation", "won", "lost"] as const;
export const INVOICE_STATUSES = ["draft", "sent", "paid", "partial", "overdue", "void"] as const;
export const CURRENCIES = ["USD", "AMD", "EUR", "RUB"] as const;
export const STAGE_PROBABILITY: Record<string, number> = { new: 0.1, discovery: 0.25, proposal: 0.5, negotiation: 0.75, won: 1, lost: 0 };

export type Lead = {
  id: number;
  created_at: number;
  status: string;
  name: string;
  email: string;
  contact: string | null;
  company: string | null;
  challenge_type: string | null;
  challenge: string | null;
  stage: string | null;
  areas: string | null;
  budget: string | null;
  timing: string | null;
  service_id: string | null;
  locale: string | null;
  page: string | null;
  visitor: string | null;
  client_id: number | null;
  delivered_to: string | null;
};

export type Client = {
  id: number;
  created_at: number;
  updated_at: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  telegram: string | null;
  country: string | null;
  language: string | null;
  source: string | null;
  status: string;
  tags: string | null;
  notes: string | null;
};

export type Deal = {
  id: number;
  client_id: number;
  client_name?: string;
  title: string;
  service_id: string | null;
  value_usd: number;
  recurring: number;
  stage: string;
  expected_close: string | null;
  created_at: number;
  updated_at: number;
  notes: string | null;
};

export type Invoice = {
  id: number;
  number: string;
  client_id: number;
  client_name?: string;
  deal_id: number | null;
  issue_date: string;
  due_date: string;
  currency: string;
  amount: number;
  status: string;
  description: string | null;
  paid: number;
};

export function leads(status?: string, q?: string) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (status && status !== "all") {
    where.push("status = ?");
    params.push(status);
  } else {
    where.push("status NOT IN ('spam','archived')");
  }
  if (q) {
    where.push("(name LIKE ? OR email LIKE ? OR company LIKE ? OR challenge LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  return all<Lead>(`SELECT * FROM leads WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT 300`, ...params);
}

export function leadCounts() {
  return Object.fromEntries(all<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM leads GROUP BY status").map((r) => [r.status, r.n]));
}

export function lead(id: number) {
  return get<Lead>("SELECT * FROM leads WHERE id = ?", id);
}

export function clients(status?: string, q?: string) {
  const where: string[] = ["1=1"];
  const params: (string | number)[] = [];
  if (status && status !== "all") {
    where.push("c.status = ?");
    params.push(status);
  }
  if (q) {
    where.push("(c.name LIKE ? OR c.company LIKE ? OR c.email LIKE ? OR c.tags LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  return all<Client & { open_value: number; billed: number; outstanding: number; next_task: string | null }>(
    `SELECT c.*,
      (SELECT COALESCE(SUM(value_usd),0) FROM deals d WHERE d.client_id = c.id AND d.stage NOT IN ('won','lost')) AS open_value,
      (SELECT COALESCE(SUM(amount),0) FROM invoices i WHERE i.client_id = c.id AND i.status != 'void' AND i.currency = 'USD') AS billed,
      0 AS outstanding,
      (SELECT MIN(due_date) FROM tasks t WHERE t.client_id = c.id AND t.done = 0) AS next_task
     FROM clients c WHERE ${where.join(" AND ")} ORDER BY c.updated_at DESC LIMIT 500`,
    ...params,
  );
}

export function client(id: number) {
  return get<Client>("SELECT * FROM clients WHERE id = ?", id);
}

export function clientOptions() {
  return all<{ id: number; name: string; company: string | null }>("SELECT id, name, company FROM clients ORDER BY name COLLATE NOCASE");
}

export function deals(clientId?: number) {
  return all<Deal>(
    `SELECT d.*, c.name AS client_name FROM deals d JOIN clients c ON c.id = d.client_id ${clientId ? "WHERE d.client_id = ?" : ""} ORDER BY d.updated_at DESC`,
    ...(clientId ? [clientId] : []),
  );
}

export function invoices(opts: { clientId?: number; status?: string } = {}) {
  const where: string[] = ["1=1"];
  const params: (string | number)[] = [];
  if (opts.clientId) {
    where.push("i.client_id = ?");
    params.push(opts.clientId);
  }
  if (opts.status && opts.status !== "all") {
    where.push("i.status = ?");
    params.push(opts.status);
  }
  const rows = all<Invoice>(
    `SELECT i.*, c.name AS client_name, (SELECT COALESCE(SUM(amount),0) FROM payments p WHERE p.invoice_id = i.id) AS paid
     FROM invoices i JOIN clients c ON c.id = i.client_id WHERE ${where.join(" AND ")} ORDER BY i.issue_date DESC, i.id DESC`,
    ...params,
  );
  const todayStr = today();
  return rows.map((r) => ({ ...r, status: r.status === "sent" && r.due_date < todayStr ? "overdue" : r.status }));
}

export function payments(invoiceId: number) {
  return all<{ id: number; date: string; amount: number; method: string | null; note: string | null }>("SELECT * FROM payments WHERE invoice_id = ? ORDER BY date", invoiceId);
}

export function expenses(limit = 200) {
  return all<{ id: number; date: string; category: string; currency: string; amount: number; note: string | null }>("SELECT * FROM expenses ORDER BY date DESC, id DESC LIMIT ?", limit);
}

export function tasks(opts: { open?: boolean; clientId?: number } = {}) {
  const where: string[] = ["1=1"];
  const params: (string | number)[] = [];
  if (opts.open) where.push("t.done = 0");
  if (opts.clientId) {
    where.push("t.client_id = ?");
    params.push(opts.clientId);
  }
  return all<{ id: number; title: string; due_date: string | null; done: number; priority: string; client_id: number | null; client_name: string | null; lead_id: number | null }>(
    `SELECT t.*, c.name AS client_name FROM tasks t LEFT JOIN clients c ON c.id = t.client_id WHERE ${where.join(" AND ")}
     ORDER BY t.done ASC, CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END, t.due_date ASC, t.id DESC LIMIT 500`,
    ...params,
  );
}

export function activities(opts: { clientId?: number; leadId?: number }) {
  return all<{ id: number; ts: number; kind: string; body: string; user_name: string | null }>(
    `SELECT a.id, a.ts, a.kind, a.body, u.name AS user_name FROM activities a LEFT JOIN users u ON u.id = a.user_id
     WHERE ${opts.clientId ? "a.client_id = ?" : "a.lead_id = ?"} ORDER BY a.ts DESC LIMIT 200`,
    (opts.clientId ?? opts.leadId)!,
  );
}

/* ───────── Finance ───────── */

export function financeSummary(months = 12) {
  const rates = fxRates();
  const pays = all<{ date: string; amount: number; currency: string }>(
    "SELECT p.date, p.amount, i.currency FROM payments p JOIN invoices i ON i.id = p.invoice_id",
  );
  const exps = all<{ date: string; amount: number; currency: string }>("SELECT date, amount, currency FROM expenses");
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(d.toISOString().slice(0, 7));
  }
  const rev = new Map(keys.map((k) => [k, 0]));
  const exp = new Map(keys.map((k) => [k, 0]));
  for (const p of pays) if (rev.has(p.date.slice(0, 7))) rev.set(p.date.slice(0, 7), rev.get(p.date.slice(0, 7))! + toUsd(p.amount, p.currency, rates));
  for (const e of exps) if (exp.has(e.date.slice(0, 7))) exp.set(e.date.slice(0, 7), exp.get(e.date.slice(0, 7))! + toUsd(e.amount, e.currency, rates));

  const inv = invoices();
  let outstanding = 0;
  let overdue = 0;
  for (const i of inv) {
    if (i.status === "void" || i.status === "draft" || i.status === "paid") continue;
    const left = toUsd(Math.max(0, i.amount - i.paid), i.currency, rates);
    outstanding += left;
    if (i.status === "overdue") overdue += left;
  }
  const thisMonth = keys[keys.length - 1];
  const lastMonth = keys[keys.length - 2];
  const year = String(now.getUTCFullYear());
  const ytd = [...rev.entries()].filter(([k]) => k.startsWith(year)).reduce((s, [, v]) => s + v, 0);
  const recurring = all<{ v: number }>("SELECT value_usd AS v FROM deals WHERE stage = 'won' AND recurring = 1").reduce((s, r) => s + r.v, 0);
  const pipeline = all<{ value_usd: number; stage: string }>("SELECT value_usd, stage FROM deals WHERE stage NOT IN ('won','lost')");
  const weighted = pipeline.reduce((s, d) => s + d.value_usd * (STAGE_PROBABILITY[d.stage] ?? 0), 0);
  return {
    months: keys.map((k) => ({ month: k, revenue: rev.get(k)!, expenses: exp.get(k)! })),
    revenueThisMonth: rev.get(thisMonth)!,
    revenueLastMonth: rev.get(lastMonth)!,
    expensesThisMonth: exp.get(thisMonth)!,
    ytd,
    outstanding,
    overdue,
    mrr: recurring,
    pipelineOpen: pipeline.reduce((s, d) => s + d.value_usd, 0),
    pipelineWeighted: weighted,
  };
}

export function nextInvoiceNumber() {
  const year = new Date().getUTCFullYear();
  const row = get<{ n: number }>("SELECT COUNT(*) AS n FROM invoices WHERE number LIKE ?", `ONYQ-${year}-%`);
  return `ONYQ-${year}-${String((row?.n ?? 0) + 1).padStart(3, "0")}`;
}

/* ───────── Search ───────── */

export function search(q: string) {
  const like = `%${q}%`;
  return {
    clients: all<{ id: number; name: string; company: string | null }>("SELECT id, name, company FROM clients WHERE name LIKE ? OR company LIKE ? OR email LIKE ? LIMIT 8", like, like, like),
    leads: all<{ id: number; name: string; email: string }>("SELECT id, name, email FROM leads WHERE name LIKE ? OR email LIKE ? OR company LIKE ? LIMIT 8", like, like, like),
    invoices: all<{ id: number; number: string; client_id: number }>("SELECT id, number, client_id FROM invoices WHERE number LIKE ? LIMIT 8", like),
  };
}
