"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation.ts";
import { ENABLED_LOCALES, LOCALE_LABELS, type AppLocale } from "@/data/locales.ts";

/**
 * Locale switcher. It lists only ENABLED locales (data/locales.ts), so an incomplete
 * translation is never offered (brief §7.2). Keeps the current page and query string.
 */
export function LanguageSwitcher({ variant = "header" }: { variant?: "header" | "drawer" }) {
  const t = useTranslations("language");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
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
          onClick={() => router.replace(`${pathname}${window.location.search}`, { locale: l, scroll: false })}
        >
          {LOCALE_LABELS[l].short}
        </button>
      ))}
    </div>
  );
}
