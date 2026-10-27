/**
 * Currency presentation. USD is the master currency for every price in data/services.ts.
 *
 * AMD — PROVISIONAL. ONYQ has not yet chosen an AMD policy [ONYQ INPUT REQUIRED]:
 * a fixed owner-managed rate, a manually updated rate, or an explicit live source.
 * Until then the site converts with one central rate taken from a public mid-market
 * quote and rounds every converted amount the same way.
 */
export type CurrencyCode = "USD" | "AMD";

export interface FxPolicy {
  ratePerUsd: number;
  status: "PROVISIONAL" | "APPROVED";
  source: string;
  updatedAt: string;
  /** Converted amounts are rounded to the nearest multiple of this value (halves round up). */
  roundTo: number;
}

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ["USD", "AMD"];
export const BASE_CURRENCY: CurrencyCode = "USD";

export const amdPolicy: FxPolicy = {
  ratePerUsd: 362,
  status: "PROVISIONAL",
  source:
    "Wise mid-market USD/AMD quote of 362.3 on 13 Oct 2026, rounded down to 362. Placeholder until ONYQ approves an AMD pricing policy.",
  updatedAt: "2026-10-18",
  roundTo: 1000,
};
