/**
 * What the CMS can edit. Every document has a key, an admin label and a group; the code
 * default for each key and language comes from content/<locale>, messages/<locale>.json and
 * data/*.ts (lib/server/cms.ts → codeDefault). Shared by the server and the admin editor.
 */
import { DIRECTION_SLUGS } from "../../data/navigation.ts";

export const CMS_LOCALES = ["en", "ru", "hy"] as const;
export type CmsLocale = (typeof CMS_LOCALES)[number];
export const LOCALE_LABEL: Record<CmsLocale, string> = { en: "English", ru: "Русский", hy: "Հայերեն" };

/** Documents edited with the same text in every language use this pseudo-locale. */
export const GLOBAL = "*";

export const MESSAGE_NAMESPACES = [
  "meta",
  "nav",
  "common",
  "footer",
  "price",
  "brief",
  "letter",
  "work",
  "pages",
  "mocks",
  "vip",
  "phone",
  "notFound",
  "a11y",
  "language",
  "theme",
] as const;

export const TOPIC_SLUGS = [...DIRECTION_SLUGS, "about", "how-we-work"] as const;

export type DocGroup = "pages" | "services" | "directions" | "work" | "catalogue" | "interface";

export interface DocInfo {
  key: string;
  label: string;
  group: DocGroup;
  /** Public page where this text appears (for the preview button). */
  path: string;
  hint?: string;
}

export const GROUP_LABEL: Record<DocGroup, string> = {
  pages: "Pages",
  services: "Service pages",
  directions: "Directions & studio pages",
  work: "Portfolio case texts",
  catalogue: "Service names & categories",
  interface: "Interface texts (menus, buttons, forms)",
};

const NAMESPACE_INFO: Record<string, { label: string; path: string; hint?: string }> = {
  meta: { label: "Site title & description", path: "/" },
  nav: { label: "Main menu", path: "/" },
  common: { label: "Common buttons & labels", path: "/" },
  footer: { label: "Footer", path: "/" },
  price: { label: "Price labels & currency", path: "/price" },
  brief: { label: "Brief form", path: "/contacts" },
  letter: { label: "Home — letter composer", path: "/" },
  work: { label: "Portfolio labels", path: "/portfolio" },
  pages: { label: "Page labels & headings", path: "/services" },
  mocks: { label: "Texts inside the illustrations", path: "/", hint: "Words drawn inside the animated scenes on the home page." },
  vip: { label: "VIP lounge", path: "/vip" },
  phone: { label: "Phone field", path: "/contacts" },
  notFound: { label: "Page not found", path: "/404" },
  a11y: { label: "Screen-reader labels", path: "/", hint: "Read aloud by screen readers; not visible on screen." },
  language: { label: "Language switcher", path: "/" },
  theme: { label: "Theme switcher", path: "/" },
};

export function docList(opts: { servicePageSlugs: { slug: string; label: string }[]; topics: { slug: string; label: string }[]; cases: { slug: string; label: string }[] }): DocInfo[] {
  return [
    { key: "home", label: "Home page", group: "pages", path: "/" },
    { key: "pricing", label: "Pricing page", group: "pages", path: "/price" },
    { key: "faq", label: "FAQ page", group: "pages", path: "/faq" },
    { key: "contacts", label: "Contacts page", group: "pages", path: "/contacts" },
    { key: "portfolio", label: "Portfolio page", group: "pages", path: "/portfolio" },
    ...opts.servicePageSlugs.map((s) => ({ key: `service:${s.slug}`, label: s.label, group: "services" as const, path: `/services/${s.slug}` })),
    ...opts.topics.map((t) => ({ key: `topic:${t.slug}`, label: t.label, group: "directions" as const, path: `/${t.slug}` })),
    ...opts.cases.map((c) => ({ key: `case:${c.slug}`, label: c.label, group: "work" as const, path: `/portfolio/${c.slug}` })),
    { key: "catalogue", label: "Service names, descriptions & categories", group: "catalogue", path: "/price" },
    ...MESSAGE_NAMESPACES.map((ns) => ({ key: `messages:${ns}`, label: NAMESPACE_INFO[ns]?.label ?? ns, group: "interface" as const, path: NAMESPACE_INFO[ns]?.path ?? "/", hint: NAMESPACE_INFO[ns]?.hint })),
  ];
}

/** Structured, language-neutral documents with their own editors. */
export const STRUCTURE_DOCS = {
  services: { key: "services", label: "Services & prices", path: "/price" },
  cases: { key: "cases", label: "Portfolio projects", path: "/portfolio" },
} as const;

/* ───────── Editor hints ───────── */

/** Technical keys: shown, never edited (changing them would break links or layout). */
export const READ_ONLY_KEYS = new Set(["slug", "key", "id", "kind", "direction", "primary", "approval", "index", "alt", "anchor"]);

/** Arrays whose length is part of the design (two-line titles, fixed label sets). */
export const FIXED_LENGTH_KEYS = new Set(["title", "labels", "layers", "lines"]);

/** Keys that hold lists of IDs; the editor offers a picker instead of free text. */
export const REFERENCE_KEYS: Record<string, "service" | "topic"> = {
  services: "service",
  priceIds: "service",
  seeAlso: "service",
  related: "topic",
};

/** Keys whose text is a link (validated: site path or https URL). */
export const LINK_KEYS = new Set(["href", "url", "detailPage"]);

const LONG_KEYS = new Set(["body", "lead", "a", "summary", "challenge", "approach", "result", "description", "text", "problem", "disclaimer", "notice"]);

export function isLongText(key: string | number, sample: string): boolean {
  return (typeof key === "string" && LONG_KEYS.has(key)) || sample.length > 90;
}

/** Turns "metricLabel" / "price-design" into "Metric label" for the editor. */
export function humanKey(key: string | number): string {
  if (typeof key === "number") return `#${key + 1}`;
  const s = key.replace(/[-_:]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
