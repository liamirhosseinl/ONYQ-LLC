import { NextResponse } from "next/server";
import { services } from "@/data/services.ts";
import { deliverEnquiry, deliveryChannel } from "@/lib/enquiry-delivery.ts";
import type { Enquiry } from "@/lib/enquiry-schema.ts";
import { vipCheckSchema, vipQuote, vipRequestSchema } from "@/lib/vip.ts";
import { parseVipCode } from "@/lib/server/vip.ts";
import { clientIp, rateLimited, readJson, sameOrigin } from "@/lib/server/security.ts";
import { storeVipLead } from "@/lib/server/leads.ts";
import { visitorId } from "@/lib/server/analytics.ts";
import { audit } from "@/lib/server/audit.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deny = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status });

/**
 * VIP lounge.
 *  POST /api/vip?step=check    { code }                      → { ok, business }
 *  POST /api/vip?step=request  { code, needs, services, … }  → { ok }
 * Same defences as the brief endpoint (same-origin, body cap, strict schema, honeypot, rate
 * limits). Code checks have their own tighter limit so the suffix can't be brute-forced, and the
 * code is checked again on every request. Prices are recomputed on the server.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request.headers)) return deny(403, "forbidden");
  const ip = clientIp(request.headers);
  const step = new URL(request.url).searchParams.get("step");

  if (step === "check") {
    if (rateLimited(`vip-check:${ip}`, 10, 10 * 60_000) || rateLimited("vip-check:all", 600, 86_400_000)) return deny(429, "rate_limited");
    const json = await readJson(request, 2 * 1024);
    const parsed = vipCheckSchema.safeParse(json);
    if (!parsed.success) return deny(400, "invalid");
    const vip = parseVipCode(parsed.data.code);
    if (!vip) {
      audit("vip.code_rejected", { ip });
      return deny(404, "unknown_code");
    }
    return NextResponse.json({ ok: true, business: vip.business });
  }

  if (step === "request") {
    if (rateLimited(`vip-req:${ip}`, 5, 10 * 60_000) || rateLimited(`vip-req-day:${ip}`, 20, 86_400_000) || rateLimited("vip-req:all", 200, 86_400_000)) {
      return deny(429, "rate_limited");
    }
    const json = await readJson(request, 16 * 1024);
    if (json === undefined) return deny(400, "invalid");
    const parsed = vipRequestSchema.safeParse(json);
    if (!parsed.success) {
      const fields = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))];
      return deny(400, "invalid", { fields });
    }
    const r = parsed.data;
    const vip = parseVipCode(r.code);
    if (!vip) return deny(403, "unknown_code");
    if (r.website) return NextResponse.json({ ok: true });

    const quote = vipQuote(r.services);
    const areas = [...new Set(r.services.map((id) => services.find((s) => s.id === id)!.category))];
    const ua = request.headers.get("user-agent") || "";

    let leadId = 0;
    try {
      leadId = storeVipLead(r, vip.business, quote, areas, { visitor: visitorId(ip, ua) });
    } catch {
      leadId = 0;
    }

    let deliveredTo: string | null = null;
    if (deliveryChannel()) {
      const lines = quote.lines.map((l) => `${l.id}: $${l.vipUsd}${l.billing === "monthly" ? "/mo" : ""} (regular $${l.regularUsd})`);
      const enquiry: Enquiry = {
        challengeType: "other",
        challenge: `[VIP · ${vip.business}]\n${r.needs}\n\nServices at VIP prices:\n${lines.join("\n")}`,
        stage: "new-idea",
        areas: areas as Enquiry["areas"],
        name: r.name,
        email: r.email || "—",
        company: vip.business,
        phone: r.phone,
        locale: r.locale,
        page: "/vip",
      };
      const result = await deliverEnquiry(enquiry);
      if (result.ok) deliveredTo = result.channel;
    }
    if (leadId) audit("lead.received", { entity: "lead", entityId: leadId, meta: { deliveredTo, vip: vip.business }, ip });

    if (leadId || deliveredTo) return NextResponse.json({ ok: true });
    return deny(502, "delivery_failed");
  }

  return deny(400, "invalid");
}

export function GET() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } });
}
