"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { promotion } from "@/data/promotion.ts";
import { amdPolicy, type CurrencyCode } from "@/data/currency.ts";
import { getPromotionStatus, type PromotionStatus } from "@/lib/pricing.ts";
import { IS_PREVIEW } from "@/lib/site-mode.ts";

interface PricingContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  status: PromotionStatus;
  /** True when ?promo=preview simulates the offer in preview mode. Never true in production. */
  isPromoPreview: boolean;
  amd: typeof amdPolicy;
}

const INITIAL_STATUS: PromotionStatus = {
  state: "disabled",
  discountPercent: promotion.discountPercent,
  startsAt: null,
  endsAt: null,
  nextChangeAt: null,
};

const PricingContext = createContext<PricingContextValue | null>(null);

/**
 * Server HTML always renders regular prices. The campaign state is resolved in the browser
 * against the real clock (time-zone-aware), and re-resolved exactly when the window opens or
 * closes — so a cached page can never keep an expired offer on screen.
 */
export function PricingProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [status, setStatus] = useState<PromotionStatus>(INITIAL_STATUS);
  const [isPromoPreview, setPromoPreview] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("currency")?.toLowerCase() === "amd") setCurrencyState("AMD");

    if (IS_PREVIEW && params.get("promo") === "preview") {
      setPromoPreview(true);
      setStatus({ ...INITIAL_STATUS, state: "active" });
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const resolve = () => {
      let next: PromotionStatus;
      try {
        next = getPromotionStatus(promotion, new Date());
      } catch (err) {
        // Misconfigured dates must never produce an active offer.
        console.error("[pricing] invalid promotion config", err);
        next = INITIAL_STATUS;
      }
      setStatus(next);
      if (next.nextChangeAt) {
        const wait = Math.max(0, next.nextChangeAt.getTime() - Date.now()) + 50;
        // setTimeout caps at ~24.8 days; re-check periodically for long waits.
        timer = setTimeout(resolve, Math.min(wait, 6 * 60 * 60 * 1000));
      }
    };
    resolve();
    const onVisible = () => document.visibilityState === "visible" && resolve();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      const url = new URL(window.location.href);
      if (c === "AMD") url.searchParams.set("currency", "amd");
      else url.searchParams.delete("currency");
      window.history.replaceState(window.history.state, "", url);
    } catch {
      /* URL update is a convenience only */
    }
  }, []);

  const value = useMemo(
    () => ({ currency, setCurrency, status, isPromoPreview, amd: amdPolicy }),
    [currency, setCurrency, status, isPromoPreview],
  );
  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

export function usePricing(): PricingContextValue {
  const ctx = useContext(PricingContext);
  if (!ctx) throw new Error("usePricing must be used inside <PricingProvider>");
  return ctx;
}
