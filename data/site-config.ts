/**
 * Central site configuration. Anything marked [ONYQ INPUT REQUIRED] is intentionally
 * empty: the UI hides features whose data is missing instead of inventing it.
 */

export type ContentStatus = "approved" | "provisional";

export interface LegalDocument {
  title: string;
  /** Approved document body (markdown-free plain paragraphs). */
  paragraphs: string[];
  updatedAt: string;
}

export const siteConfig = {
  name: "ONYQ",
  /** Fact supplied in the brief: ONYQ is a software company registered in Armenia. */
  registration: { country: "Armenia", approved: true },
  /** [ONYQ INPUT REQUIRED] exact legal name (EN / HY) — publish only if approved. */
  legalName: null as string | null,
  /** Tax identification number (TIN / ՀՎՀՀ), supplied by ONYQ 29 Oct 2026. */
  taxId: "01384049" as string | null,
  /** [ONYQ INPUT REQUIRED] business address — publish only if approved. */
  address: null as string | null,

  /** Canonical origin used for metadata, sitemap and hreflang. Set NEXT_PUBLIC_SITE_URL in production. */
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://onyq.am").replace(/\/$/, ""),

  /** Brand book tagline (approved, edition 02). Localised copies live in messages → footer.tagline. */
  tagline: { text: "intelligence, naturally.", status: "approved" as ContentStatus },

  /**
   * Public contact routes. [ONYQ INPUT REQUIRED] — every null value hides its UI.
   * Never copy reference-site contacts here.
   */
  contact: {
    salesEmail: "onyq.llc@gmail.com" as string | null,
    telegram: null as string | null, // e.g. "onyq" (without @)
    whatsapp: null as string | null, // E.164 number
    /** Several numbers are comma-separated (see lib/contact.ts). */
    phone: "+374 94 809506, +374 94 406207" as string | null,
  },

  /** [ONYQ INPUT REQUIRED] official social profiles: { label, url } */
  social: [] as { label: string; url: string }[],

  /** [ONYQ INPUT REQUIRED] company-approved legal documents. A null entry = no route, no link. */
  legal: {
    privacyPolicy: null as LegalDocument | null,
    terms: null as LegalDocument | null,
    cancellation: null as LegalDocument | null,
  },

  /** [ONYQ INPUT REQUIRED] people who approved public profiles. Empty = Team section omitted. */
  team: [] as { name: string; role: string; bio: string; photo?: string }[],

  /** [ONYQ INPUT REQUIRED] real ONYQ products. Empty = Products menu and pages omitted. */
  products: [] as { name: string; url: string; summary: string }[],

  /** [ONYQ INPUT REQUIRED] approved client case studies. Empty = concept studies only. */
  caseStudies: [] as { slug: string; title: string }[],
};

export type SiteConfig = typeof siteConfig;

/** True when at least one direct contact route is configured. */
export function hasDirectContact(): boolean {
  const c = siteConfig.contact;
  return Boolean(c.salesEmail || c.telegram || c.whatsapp || c.phone);
}
