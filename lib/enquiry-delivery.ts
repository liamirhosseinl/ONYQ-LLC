/**
 * Enquiry delivery. [ONYQ INPUT REQUIRED] — choose a destination and set environment variables:
 *
 *   Option A — any webhook (CRM, Make/Zapier, Slack workflow, own backend):
 *     ENQUIRY_WEBHOOK_URL=https://…           (receives the validated JSON enquiry via POST)
 *     ENQUIRY_WEBHOOK_SECRET=…                 (optional; sent as the X-ONYQ-Signature HMAC-SHA256 header)
 *
 *   Option B — email through Resend (https://resend.com):
 *     RESEND_API_KEY=…  ENQUIRY_TO_EMAIL=sales@…  ENQUIRY_FROM_EMAIL="ONYQ website <web@…>"
 *
 * With neither configured the API answers 503 and the form tells the visitor plainly that
 * nothing was sent. It never shows a success state without a confirmed delivery.
 */
import { createHmac } from "node:crypto";
import type { Enquiry } from "./enquiry-schema.ts";

export type DeliveryResult = { ok: true; channel: "webhook" | "email" } | { ok: false; reason: "not_configured" | "failed" };

export function deliveryChannel(env = process.env): "webhook" | "email" | null {
  if (env.ENQUIRY_WEBHOOK_URL) return "webhook";
  if (env.RESEND_API_KEY && env.ENQUIRY_TO_EMAIL && env.ENQUIRY_FROM_EMAIL) return "email";
  return null;
}

function asText(e: Enquiry): string {
  return [
    `Challenge type: ${e.challengeType}`,
    `Challenge: ${e.challenge}`,
    e.serviceId ? `Opened from price entry: ${e.serviceId}` : null,
    `Starting point: ${e.stage}`,
    `Areas: ${e.areas.join(", ") || "—"}`,
    `Budget: ${e.budget ?? "—"}`,
    `Timing: ${e.timing ?? "—"}`,
    `Name: ${e.name}`,
    `Email: ${e.email}`,
    e.company ? `Company: ${e.company}` : null,
    e.phone ? `Phone / messenger: ${e.phone}` : null,
    `Site language: ${e.locale}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function deliverEnquiry(enquiry: Enquiry, env = process.env, fetchImpl: typeof fetch = fetch): Promise<DeliveryResult> {
  const channel = deliveryChannel(env);
  if (!channel) return { ok: false, reason: "not_configured" };

  const { website: _honeypot, ...clean } = enquiry;
  const body = { type: "onyq.enquiry", receivedAt: new Date().toISOString(), enquiry: clean };

  try {
    if (channel === "webhook") {
      const json = JSON.stringify(body);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (env.ENQUIRY_WEBHOOK_SECRET) {
        headers["X-ONYQ-Signature"] = createHmac("sha256", env.ENQUIRY_WEBHOOK_SECRET).update(json).digest("hex");
      }
      const res = await fetchImpl(env.ENQUIRY_WEBHOOK_URL!, { method: "POST", headers, body: json, signal: AbortSignal.timeout(10_000) });
      return res.ok ? { ok: true, channel } : { ok: false, reason: "failed" };
    }

    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.ENQUIRY_FROM_EMAIL,
        to: [env.ENQUIRY_TO_EMAIL],
        reply_to: enquiry.email,
        subject: `New brief: ${enquiry.challengeType} — ${enquiry.name}`,
        text: asText(enquiry),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok ? { ok: true, channel } : { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
