"use client";

import { useLocale, useTranslations } from "next-intl";
import { getPathname, usePathname } from "@/i18n/navigation.ts";
import { ENABLED_LOCALES, LOCALE_LABELS, type AppLocale } from "@/data/locales.ts";

/**
 * Locale switcher. It lists only ENABLED locales (data/locales.ts), so an incomplete
 * translation is never offered (brief §7.2). Keeps the current page and query string.
 *
 * Switching language is a full page load, not a client-side transition: each language renders
 * its own <html> (lang, fonts, sizes), and a client-side swap of the root layout dropped the
 * attributes the head bootstrap sets (theme, motion) — which froze every scroll animation on
 * the RU/HY pages. A real load runs the bootstrap again, exactly like a first visit.
 */
export function LanguageSwitcher({ variant = "header" }: { variant?: "header" | "drawer" }) {
  const t = useTranslations("language");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();

  if (ENABLED_LOCALES.length < 2) return null;

  return (
    <div className={`lang lang--${variant}`} role="group" aria-label={t("label")}>
      {ENABLED_LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={LOCALE_LABELS[l].htmlLang}
          className="lang__btn"
          aria-pressed={l === locale}
          aria-label={LOCALE_LABELS[l].native}
          onClick={() => {
            if (l === locale) return;
            window.location.assign(getPathname({ href: pathname, locale: l }) + window.location.search + window.location.hash);
          }}
        >
          {LOCALE_LABELS[l].short}
        </button>
      ))}
    </div>
  );
}
