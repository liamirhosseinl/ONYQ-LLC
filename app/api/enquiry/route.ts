import { NextResponse } from "next/server";
import { enquirySchema } from "@/lib/enquiry-schema.ts";
import { deliverEnquiry, deliveryChannel } from "@/lib/enquiry-delivery.ts";
import { clientIp, rateLimited, readJson, sameOrigin } from "@/lib/server/security.ts";
import { storeLead } from "@/lib/server/leads.ts";
import { visitorId } from "@/lib/server/analytics.ts";
import { audit } from "@/lib/server/audit.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deny = (status: number, error: string, extra: Record<string, unknown> = {}) => NextResponse.json({ ok: false, error, ...extra }, { status });

/**
 * Brief submissions.
 * Defences: same-origin check (CSRF), 16 KB body cap, schema validation (zod), honeypot,
 * rate limits per IP (5 / 10 min, 20 / day), and the brief is stored server-side before any
 * forwarding, so nothing is lost if the webhook or email provider is down.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request.headers)) return deny(403, "forbidden");
  const ip = clientIp(request.headers);
  if (rateLimited(`enquiry:${ip}`, 5, 10 * 60_000) || rateLimited(`enquiry-day:${ip}`, 20, 86_400_000) || rateLimited("enquiry:all", 200, 86_400_000)) {
    return deny(429, "rate_limited");
  }

  const json = await readJson(request, 16 * 1024);
  if (json === undefined) return deny(400, "invalid");

  const parsed = enquirySchema.safeParse(json);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))];
    return deny(400, "invalid", { fields });
  }

  // Honeypot filled → pretend success to the bot, keep nothing.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const ua = request.headers.get("user-agent") || "";
  let leadId: number;
  try {
    leadId = storeLead(parsed.data, { page: parsed.data.page ?? null, visitor: visitorId(ip, ua) });
  } catch {
    leadId = 0;
  }

  let deliveredTo: string | null = null;
  if (deliveryChannel()) {
    const result = await deliverEnquiry(parsed.data);
    if (result.ok) deliveredTo = result.channel;
  }
  if (leadId) audit("lead.received", { entity: "lead", entityId: leadId, meta: { deliveredTo }, ip });

  if (leadId || deliveredTo) return NextResponse.json({ ok: true });
  return deny(502, "delivery_failed");
}

export function GET() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } });
}
