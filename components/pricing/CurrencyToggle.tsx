"use client";

import { useTranslations } from "next-intl";
import { SUPPORTED_CURRENCIES } from "@/data/currency.ts";
import { usePricing } from "./PricingProvider.tsx";

export function CurrencyToggle({ tone = "dark" }: { tone?: "dark" | "paper" }) {
  const t = useTranslations("price");
  const { currency, setCurrency } = usePricing();
  return (
    <div className={`segmented segmented--${tone}`} role="group" aria-label={t("currency")}>
      {SUPPORTED_CURRENCIES.map((c) => (
        <button
          key={c}
          type="button"
          className="segmented__btn"
          aria-pressed={currency === c}
          onClick={() => setCurrency(c)}
          data-currency-option={c}
        >
          {c === "USD" ? t("usd") : t("amd")}
        </button>
      ))}
    </div>
  );
}

/** Explains the AMD conversion whenever AMD is selected. */
export function CurrencyNote() {
  const t = useTranslations("price");
  const { currency, amd } = usePricing();
  if (currency !== "AMD") return null;
  return (
    <p className="currency-note t-small" role="note">
      {amd.status === "APPROVED" ? t("amdNoteApproved", { rate: amd.ratePerUsd }) : t("amdNote", { rate: amd.ratePerUsd })}
    </p>
  );
}
