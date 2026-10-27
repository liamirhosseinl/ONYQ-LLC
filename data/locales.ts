/**
 * Locale registry. English, Russian and Armenian are complete (messages/<locale>.json and
 * content/<locale>/) and enabled. `npm run check:i18n` fails the build check if an enabled
 * locale is missing a UI string; content modules are type-checked against the English shapes.
 */
export const ALL_LOCALES = ["en", "ru", "hy"] as const;
export type AppLocale = (typeof ALL_LOCALES)[number];

export const ENABLED_LOCALES: AppLocale[] = ["en", "ru", "hy"];
export const DEFAULT_LOCALE: AppLocale = "en";

export const LOCALE_LABELS: Record<AppLocale, { native: string; short: string; htmlLang: string }> = {
  en: { native: "English", short: "EN", htmlLang: "en" },
  ru: { native: "Русский", short: "RU", htmlLang: "ru" },
  hy: { native: "Հայերեն", short: "HY", htmlLang: "hy" },
};
