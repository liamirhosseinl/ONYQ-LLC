import { z } from "zod";
import { services, type ServiceId } from "../data/services.ts";
import { discountedUsd } from "./pricing.ts";
import { formatPhone } from "./phone.ts";

/**
 * VIP clients (/vip). An ONYQ manager hands an invited client a code in the form
 * "<business name>/<suffix>"; the suffix is checked on the server only (lib/server/vip.ts),
 * so it never ships in page code. Inside, every service is shown at VIP_DISCOUNT_PERCENT off
 * the public starting price. Nothing is charged online: the request lands in Admin → Inbox,
 * flagged VIP with the business name, and a manager follows up to sign the contract.
 */
export const VIP_DISCOUNT_PERCENT = 60;

export function vipPriceUsd(regularUsd: number): number {
  return discountedUsd(regularUsd, VIP_DISCOUNT_PERCENT);
}

const SERVICE_IDS = services.map((s) => s.id) as [ServiceId, ...ServiceId[]];

export const vipCheckSchema = z.object({
  code: z.string().trim().min(3).max(120),
});

export const vipRequestSchema = z.object({
  code: z.string().trim().min(3).max(120),
  needs: z.string().trim().min(10, "needs_short").max(3000, "needs_long"),
  services: z.array(z.enum(SERVICE_IDS)).min(1, "services_none").max(SERVICE_IDS.length),
  name: z.string().trim().min(2, "name_required").max(120, "name_long"),
  phone: z
    .string()
    .trim()
    .max(60, "phone_invalid")
    .refine((v) => formatPhone(v) !== null, "phone_invalid")
    .transform((v) => formatPhone(v) ?? v),
  email: z.union([z.literal(""), z.string().trim().max(200, "email_invalid").pipe(z.email("email_invalid"))]).default(""),
  locale: z.enum(["en", "ru", "hy"]).default("en").catch("en"),
  /** Honeypot. */
  website: z.string().max(500).optional(),
});

export type VipRequest = z.output<typeof vipRequestSchema>;

export interface VipLine {
  id: ServiceId;
  billing: "one_time" | "monthly";
  regularUsd: number;
  vipUsd: number;
}

/** Prices are always recomputed from the catalogue — never taken from the browser. */
export function vipQuote(ids: ServiceId[]) {
  const lines: VipLine[] = [...new Set(ids)].map((id) => {
    const s = services.find((x) => x.id === id)!;
    return { id, billing: s.billingType, regularUsd: s.regularPriceUsd, vipUsd: vipPriceUsd(s.regularPriceUsd) };
  });
  const sum = (b: VipLine["billing"], k: "regularUsd" | "vipUsd") =>
    Math.round(lines.filter((l) => l.billing === b).reduce((n, l) => n + l[k], 0) * 100) / 100;
  return {
    lines,
    oneTime: { regularUsd: sum("one_time", "regularUsd"), vipUsd: sum("one_time", "vipUsd") },
    monthly: { regularUsd: sum("monthly", "regularUsd"), vipUsd: sum("monthly", "vipUsd") },
  };
}
