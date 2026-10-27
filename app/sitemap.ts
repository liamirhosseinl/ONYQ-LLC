import type { MetadataRoute } from "next";
import { ENABLED_LOCALES, DEFAULT_LOCALE } from "@/data/locales.ts";
import { siteConfig } from "@/data/site-config.ts";
import { servicePages } from "@/content/en/service-pages.ts";
import { caseStudies } from "@/data/cases.ts";
import { DIRECTION_SLUGS } from "@/data/navigation.ts";
import { absoluteUrl } from "@/lib/metadata.ts";

/** Only routes that exist and only locales that are enabled. Legal pages appear once published. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/services",
    ...DIRECTION_SLUGS.map((s) => `/${s}`),
    ...servicePages.map((p) => `/services/${p.slug}`),
    "/price",
    "/portfolio",
    ...caseStudies.map((c) => `/portfolio/${c.slug}`),
    "/about",
    "/how-we-work",
    "/faq",
    "/contacts",
    ...(siteConfig.legal.privacyPolicy ? ["/privacy-policy"] : []),
    ...(siteConfig.legal.terms ? ["/terms"] : []),
    ...(siteConfig.legal.cancellation ? ["/cancellation"] : []),
  ];
  return paths.map((path) => ({
    url: absoluteUrl(path, DEFAULT_LOCALE),
    changeFrequency: path === "/price" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/price" || path === "/services" ? 0.9 : 0.7,
    alternates:
      ENABLED_LOCALES.length > 1
        ? { languages: Object.fromEntries(ENABLED_LOCALES.map((l) => [l, absoluteUrl(path, l)])) }
        : undefined,
    images: path.startsWith("/portfolio/") ? [absoluteUrl(caseStudies.find((c) => path.endsWith(c.slug))!.cover.src, DEFAULT_LOCALE)] : undefined,
  }));
}
