import "server-only";
import { run } from "./db.ts";
import type { Enquiry } from "@/lib/enquiry-schema.ts";

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
