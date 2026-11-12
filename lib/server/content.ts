import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getContent as getCodeContent, type ContentBundle } from "@/content/index.ts";
import type { CatalogueBundle } from "@/content/catalogue.ts";
import type { CaseCopy } from "@/content/types.ts";
import { categories as codeCategories, type Category } from "@/data/services.ts";
import { GLOBAL, MESSAGE_NAMESPACES, TOPIC_SLUGS } from "@/lib/cms/registry.ts";
import { effective, type CaseEntry, type Mode, type ServiceEntry } from "./cms.ts";
import { can, getUser } from "./auth.ts";

/**
 * What the public site reads. Every getter returns code defaults merged with the published
 * CMS overrides — or, for a signed-in editor who switched preview on, with the drafts.
 */

export const PREVIEW_COOKIE = "onyq_preview";

/** True only for a signed-in manager (or above) with the preview cookie set. */
export const isPreview = cache(async (): Promise<boolean> => {
  try {
    const jar = await cookies();
    if (jar.get(PREVIEW_COOKIE)?.value !== "1") return false;
    const user = await getUser();
    return Boolean(user && can(user, "manager"));
  } catch {
    return false;
  }
});

async function mode(): Promise<Mode> {
  return (await isPreview()) ? "draft" : "published";
}

const servicesFor = cache((m: Mode) => effective<ServiceEntry[]>("services", GLOBAL, m));
const casesFor = cache((m: Mode) => effective<CaseEntry[]>("cases", GLOBAL, m));

export interface LiveCatalogue {
  /** Every service, hidden ones included (so old briefs and links still resolve). */
  all: ServiceEntry[];
  /** Services shown on the site, in order. */
  services: ServiceEntry[];
  categories: Category[];
  copy: CatalogueBundle;
}

const catalogueFor = cache((locale: string, m: Mode): LiveCatalogue => {
  const all = servicesFor(m);
  const copy = effective<CatalogueBundle>("catalogue", locale, m);
  const en = locale === "en" ? copy : effective<CatalogueBundle>("catalogue", "en", m);
  // A service added in the CMS without a translation falls back to its English name.
  const serviceCopy = { ...copy.serviceCopy } as Record<string, { name: string; short: string }>;
  for (const s of all) {
    if (!serviceCopy[s.id]) serviceCopy[s.id] = (en.serviceCopy as Record<string, { name: string; short: string }>)[s.id] ?? { name: s.id, short: "" };
  }
  return {
    all,
    services: all.filter((s) => !s.hidden),
    categories: codeCategories,
    copy: { ...copy, serviceCopy: serviceCopy as CatalogueBundle["serviceCopy"] },
  };
});

export async function getCatalogue(locale: string): Promise<LiveCatalogue> {
  return catalogueFor(locale, await mode());
}

/** Case studies shown on the site, in the CMS order. */
export async function getCases(): Promise<CaseEntry[]> {
  return casesFor(await mode()).filter((c) => !c.hidden);
}

export async function getCaseBySlug(slug: string): Promise<CaseEntry | undefined> {
  return (await getCases()).find((c) => c.slug === slug);
}

const contentFor = cache((locale: string, m: Mode): ContentBundle => {
  // The list of service pages is fixed in code (each one is a route); their copy is editable.
  const servicePages = getCodeContent(locale).servicePages.map((p) => effective(`service:${p.slug}`, locale, m)) as ContentBundle["servicePages"];
  const topics = Object.fromEntries(TOPIC_SLUGS.map((slug) => [slug, effective(`topic:${slug}`, locale, m)])) as unknown as ContentBundle["topics"];
  const cases = Object.fromEntries(
    casesFor(m).map((c) => {
      const copy = effective<CaseCopy>(`case:${c.slug}`, locale, m);
      if (locale === "en") return [c.slug, copy];
      // A project added in the CMS may not be translated yet: empty fields use the English text.
      const en = effective<CaseCopy>(`case:${c.slug}`, "en", m);
      const filled = Object.fromEntries(
        Object.entries(copy).map(([k, v]) => {
          const e = (en as unknown as Record<string, unknown>)[k];
          const empty = v === "" || (Array.isArray(v) && v.length === 0);
          if (k === "alts") return [k, { ...(e as object), ...Object.fromEntries(Object.entries(v as object).filter(([, x]) => x)) }];
          return [k, empty ? e : v];
        }),
      );
      return [c.slug, filled];
    }),
  ) as ContentBundle["cases"];
  return {
    home: effective("home", locale, m),
    pricingPage: effective("pricing", locale, m),
    faqPage: effective("faq", locale, m),
    contactsPage: effective("contacts", locale, m),
    portfolioPage: effective("portfolio", locale, m),
    servicePages,
    topics,
    cases,
  } as ContentBundle;
});

/** Page copy for a language, with CMS changes applied. */
export async function getContent(locale: string): Promise<ContentBundle> {
  return contentFor(locale, await mode());
}

const messagesFor = cache((locale: string, base: Record<string, unknown>, m: Mode) => {
  const out: Record<string, unknown> = { ...base };
  for (const ns of MESSAGE_NAMESPACES) out[ns] = effective(`messages:${ns}`, locale, m);
  return out;
});

/** Interface strings (next-intl messages) with CMS changes applied. */
export async function getMessages(locale: string, base: Record<string, unknown>) {
  return messagesFor(locale, base, await mode());
}
