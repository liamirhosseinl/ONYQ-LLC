import "server-only";
import { run } from "./db.ts";
import type { Enquiry } from "@/lib/enquiry-schema.ts";
import type { VipRequest, vipQuote } from "@/lib/vip.ts";

/** Every brief from the site lands in the admin inbox (and on any configured webhook / email). */
export function storeLead(e: Enquiry, opts: { page?: string | null; visitor?: string | null; deliveredTo?: string | null }) {
  const now = Date.now();
  const res = run(
    `INSERT INTO leads (created_at, updated_at, status, name, email, contact, company, challenge_type, challenge, stage, areas, budget, timing, service_id, locale, page, visitor, delivered_to)
     VALUES (?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    now,
    now,
    e.name,
    e.email,
    e.phone || null,
    e.company || null,
    e.challengeType,
    e.challenge,
    e.stage,
    e.areas.join(","),
    e.budget ?? null,
    e.timing ?? null,
    e.serviceId ?? null,
    e.locale,
    opts.page ?? null,
    opts.visitor ?? null,
    opts.deliveredTo ?? null,
  );
  return Number(res.lastInsertRowid);
}

/**
 * A request from the VIP lounge. It goes into the same inbox, flagged with the business name
 * taken from the invitation code and the quote (regular and VIP prices) computed on the server.
 */
export function storeVipLead(
  r: VipRequest,
  business: string,
  quote: ReturnType<typeof vipQuote>,
  areas: string[],
  opts: { visitor?: string | null },
) {
  const now = Date.now();
  const res = run(
    `INSERT INTO leads (created_at, updated_at, status, name, email, contact, company, challenge_type, challenge, stage, areas, budget, timing, service_id, locale, page, visitor, delivered_to, vip_business, vip_quote)
     VALUES (?, ?, 'new', ?, ?, ?, ?, 'other', ?, NULL, ?, NULL, NULL, ?, ?, '/vip', ?, NULL, ?, ?)`,
    now,
    now,
    r.name,
    r.email || "",
    r.phone,
    business,
    r.needs,
    areas.join(","),
    quote.lines.length === 1 ? quote.lines[0].id : null,
    r.locale,
    opts.visitor ?? null,
    business,
    JSON.stringify(quote),
  );
  return Number(res.lastInsertRowid);
}
