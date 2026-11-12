"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { services as codeServices, categories as codeCategories, type Category, type ServiceId, type ServicePrice } from "@/data/services.ts";
import { getCatalogueCopy, type CatalogueBundle } from "@/content/catalogue.ts";

/**
 * The live service catalogue (prices, names, categories) for client components. The layout
 * fills it on the server with the CMS-published values (or drafts in preview), so the brief,
 * the price tags and the VIP lounge always agree with the pages around them.
 */
export interface ClientService extends ServicePrice {
  hidden?: boolean;
}

export interface CatalogueValue {
  all: ClientService[];
  services: ClientService[];
  categories: Category[];
  copy: CatalogueBundle;
}

const Ctx = createContext<CatalogueValue | null>(null);

export function CatalogueProvider({ value, children }: { value: CatalogueValue; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const fallbackCache = new Map<string, CatalogueValue>();
function fallback(locale: string): CatalogueValue {
  if (!fallbackCache.has(locale)) {
    fallbackCache.set(locale, { all: codeServices, services: codeServices, categories: codeCategories, copy: getCatalogueCopy(locale) });
  }
  return fallbackCache.get(locale)!;
}

export function useCatalogue(locale = "en"): CatalogueValue {
  return useContext(Ctx) ?? fallback(locale);
}

/** Looks a service up in the live catalogue; unknown IDs fall back to the code catalogue. */
export function useServiceLookup() {
  const cat = useCatalogue();
  return useMemo(() => {
    const byId = new Map(cat.all.map((s) => [s.id, s]));
    return (id: ServiceId | string): ClientService | undefined => byId.get(id as ServiceId) ?? codeServices.find((s) => s.id === id);
  }, [cat]);
}

export function serviceName(cat: CatalogueValue, id: string): string {
  return (cat.copy.serviceCopy as Record<string, { name: string }>)[id]?.name ?? id;
}
