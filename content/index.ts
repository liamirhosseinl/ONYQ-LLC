/**
 * Locale-aware page content (server-side). Each locale ships the same modules in
 * content/<locale>/, typed against the English shapes (content/types.ts).
 * UI strings live in messages/<locale>.json; client-safe catalogue copy in content/catalogue.ts.
 */
import type { AppLocale } from "../data/locales.ts";
import * as en from "./en/bundle.ts";
import * as ru from "./ru/bundle.ts";
import * as hy from "./hy/bundle.ts";

export { getCatalogueCopy } from "./catalogue.ts";

const bundles = { en, ru, hy } satisfies Record<AppLocale, typeof en>;

export type ContentBundle = typeof en;

export function getContent(locale: string): ContentBundle {
  return bundles[locale as AppLocale] ?? bundles.en;
}
