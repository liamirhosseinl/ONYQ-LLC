import type { Metadata } from "next";
import { ENABLED_LOCALES, DEFAULT_LOCALE } from "../data/locales.ts";
import { siteConfig } from "../data/site-config.ts";
import { IS_PREVIEW } from "./site-mode.ts";

/** Path for a locale under localePrefix "as-needed": default locale has no prefix. */
export function localizedPath(path: string, locale: string): string {
  const clean = path === "/" ? "" : path;
  return locale === DEFAULT_LOCALE ? clean || "/" : `/${locale}${clean}`;
}

export function absoluteUrl(path: string, locale: string): string {
  return `${siteConfig.url}${localizedPath(path, locale)}`;
}

/**
 * Per-page metadata with canonical + hreflang for implemented locales only.
 * Preview builds are marked noindex so a review deployment never competes in search.
 */
export function pageMetadata({
  title,
  description,
  path,
  locale,
}: {
  title: string;
  description: string;
  path: string;
  locale: string;
}): Metadata {
  const languages: Record<string, string> = {};
  for (const l of ENABLED_LOCALES) languages[l] = absoluteUrl(path, l);
  if (ENABLED_LOCALES.length > 1) languages["x-default"] = absoluteUrl(path, DEFAULT_LOCALE);

  return {
    title,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: absoluteUrl(path, locale), languages },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title,
      description,
      url: absoluteUrl(path, locale),
      locale: ({ en: "en_US", ru: "ru_RU", hy: "hy_AM" } as Record<string, string>)[locale] ?? locale,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: IS_PREVIEW ? { index: false, follow: false } : { index: true, follow: true },
  };
}
