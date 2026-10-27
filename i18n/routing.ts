import { defineRouting } from "next-intl/routing";
import { ENABLED_LOCALES, DEFAULT_LOCALE } from "../data/locales.ts";

/**
 * Only locales with complete, reviewed translations are routed.
 * RU and HY are prepared in data/locales.ts and messages/, but stay disabled
 * until ONYQ approves full translations (see docs/implementation-notes.md).
 */
export const routing = defineRouting({
  locales: ENABLED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",
  localeDetection: false,
});
