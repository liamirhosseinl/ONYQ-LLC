import "server-only";
import { z } from "zod";
import { get, run } from "./db.ts";
import { siteConfig } from "@/data/site-config.ts";

/**
 * Settings the owner edits in the admin panel (Settings → Website). Values stored in the
 * database override the defaults in data/site-config.ts; an empty value hides its UI.
 */
export const contactSchema = z.object({
  salesEmail: z.union([z.email().max(200), z.literal("")]).nullable(),
  telegram: z.union([z.string().regex(/^[A-Za-z0-9_]{4,40}$/), z.literal("")]).nullable(),
  whatsapp: z.union([z.string().regex(/^\+?[0-9 ]{7,20}$/), z.literal("")]).nullable(),
  phone: z.union([z.string().regex(/^\+?[0-9 ()-]{7,24}$/), z.literal("")]).nullable(),
  securityEmail: z.union([z.email().max(200), z.literal("")]).nullable(),
  social: z
    .array(z.object({ label: z.string().min(1).max(40), url: z.url().max(300).refine((u) => u.startsWith("https://"), "https only") }))
    .max(10),
});

export type SiteContact = {
  salesEmail: string | null;
  telegram: string | null;
  whatsapp: string | null;
  phone: string | null;
  securityEmail: string | null;
  social: { label: string; url: string }[];
};

export function getSiteContact(): SiteContact {
  const base: SiteContact = { ...siteConfig.contact, securityEmail: null, social: siteConfig.social };
  // Don't create a database while the site is being built.
  if (process.env.NEXT_PHASE === "phase-production-build") return base;
  try {
    const row = get<{ value: string }>("SELECT value FROM settings WHERE key = 'site.contact'");
    if (!row) return base;
    const parsed = contactSchema.partial().safeParse(JSON.parse(row.value));
    if (!parsed.success) return base;
    const v = parsed.data;
    const clean = (x: string | null | undefined, fallback: string | null) => (x === undefined ? fallback : x || null);
    return {
      salesEmail: clean(v.salesEmail, base.salesEmail),
      telegram: clean(v.telegram, base.telegram),
      whatsapp: clean(v.whatsapp, base.whatsapp),
      phone: clean(v.phone, base.phone),
      securityEmail: clean(v.securityEmail, null),
      social: v.social ?? base.social,
    };
  } catch {
    return base;
  }
}

export function saveSiteContact(v: z.infer<typeof contactSchema>) {
  run(
    "INSERT INTO settings (key, value, updated_at) VALUES ('site.contact', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    JSON.stringify(v),
    Date.now(),
  );
}
