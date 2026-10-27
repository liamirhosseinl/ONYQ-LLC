import { getUser, can } from "@/lib/server/auth.ts";
import { all } from "@/lib/server/db.ts";
import { audit } from "@/lib/server/audit.ts";

export const dynamic = "force-dynamic";

const QUERIES: Record<string, string> = {
  clients: "SELECT id, created_at, name, company, email, phone, telegram, country, language, source, status, tags FROM clients ORDER BY id",
  leads: "SELECT id, created_at, status, name, email, contact, company, challenge_type, challenge, stage, areas, budget, timing, service_id, locale, page FROM leads ORDER BY id",
  invoices:
    "SELECT i.number, c.name AS client, i.issue_date, i.due_date, i.currency, i.amount, (SELECT COALESCE(SUM(amount),0) FROM payments p WHERE p.invoice_id = i.id) AS paid, i.status, i.description FROM invoices i JOIN clients c ON c.id = i.client_id ORDER BY i.id",
  analytics: "SELECT ts, day, path, locale, referrer, utm_source, utm_medium, utm_campaign, country, device, browser, os, duration_ms, scroll FROM pageviews ORDER BY ts DESC LIMIT 200000",
};

/** Neutralise spreadsheet formula injection (OWASP CSV injection). */
function cell(v: unknown) {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_: Request, { params }: { params: Promise<{ kind: string }> }) {
  const user = await getUser();
  if (!user || !can(user, "manager")) return new Response("Not found", { status: 404 });
  const { kind } = await params;
  const sql = QUERIES[kind];
  if (!sql) return new Response("Not found", { status: 404 });
  const rows = all<Record<string, unknown>>(sql);
  const cols = rows[0] ? Object.keys(rows[0]) : [];
  const csv = "﻿" + [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n");
  audit("export", { userId: user.id, entity: kind, meta: { rows: rows.length } });
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="onyq-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
