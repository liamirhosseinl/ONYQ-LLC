/** Client-safe catalogue copy lookup (kept separate so page copy isn't bundled into client JS). */
import type { AppLocale } from "../data/locales.ts";
import * as en from "./en/catalogue.ts";
import * as ru from "./ru/catalogue.ts";
import * as hy from "./hy/catalogue.ts";

const catalogue = { en, ru, hy } satisfies Record<AppLocale, typeof en>;

export type CatalogueBundle = typeof en;

export function getCatalogueCopy(locale: string): CatalogueBundle {
  return catalogue[locale as AppLocale] ?? catalogue.en;
}
