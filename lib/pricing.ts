/**
 * Pricing engine: promotion state, discount maths and currency conversion.
 * Pure functions only — every component that shows a price goes through here.
 */
import type { PromotionConfig } from "../data/promotion.ts";
import type { BillingType, ServicePrice } from "../data/services.ts";
import type { CurrencyCode, FxPolicy } from "../data/currency.ts";
import { zonedTimeToUtc } from "./zoned-time.ts";
import { formatNumber, formatUsd } from "./format.ts";

export type PromotionState = "disabled" | "unconfigured" | "scheduled" | "active" | "ended";

export interface PromotionStatus {
  state: PromotionState;
  discountPercent: number;
  startsAt: Date | null;
  endsAt: Date | null;
  /** Instant at which the state will next change, if any. */
  nextChangeAt: Date | null;
}

/**
 * Resolve the campaign state at `now`.
 * Window is [startsAt, endsAt): active at the exact start instant, ended at the exact end instant.
 */
export function getPromotionStatus(config: PromotionConfig, now: Date): PromotionStatus {
  const base = { discountPercent: config.discountPercent, startsAt: null, endsAt: null, nextChangeAt: null };
  if (!config.enabled) return { ...base, state: "disabled" };
  if (!config.startLocal || !config.endLocal) return { ...base, state: "unconfigured" };

  const startsAt = zonedTimeToUtc(config.startLocal, config.timezone);
  const endsAt = zonedTimeToUtc(config.endLocal, config.timezone);
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new Error("Promotion end must be after its start.");
  }
  const t = now.getTime();
  if (t < startsAt.getTime()) return { ...base, state: "scheduled", startsAt, endsAt, nextChangeAt: startsAt };
  if (t < endsAt.getTime()) return { ...base, state: "active", startsAt, endsAt, nextChangeAt: endsAt };
  return { ...base, state: "ended", startsAt, endsAt };
}

/** 59% off → pay 41%. Computed in integer cents, rounded half-up to 2 decimals. */
export function discountedUsd(regularUsd: number, discountPercent: number): number {
  const cents = Math.round(regularUsd * 100);
  return Math.round((cents * (100 - discountPercent)) / 100) / 100;
}

export function convertUsd(amountUsd: number, currency: CurrencyCode, amd: FxPolicy): number {
  if (currency === "USD") return amountUsd;
  const raw = amountUsd * amd.ratePerUsd;
  return Math.floor(raw / amd.roundTo + 0.5) * amd.roundTo;
}

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface PriceQuote {
  billingType: BillingType;
  regular: Money;
  /** Present only while the promotion is active and the service is eligible. */
  promo: Money | null;
  /** For monthly services under promotion: the price from the second month on. */
  renewal: Money | null;
}

export function quoteService(
  service: Pick<ServicePrice, "regularPriceUsd" | "billingType" | "promoEligible">,
  status: PromotionStatus,
  currency: CurrencyCode,
  amd: FxPolicy,
): PriceQuote {
  const regular: Money = { amount: convertUsd(service.regularPriceUsd, currency, amd), currency };
  const promoApplies = status.state === "active" && service.promoEligible;
  if (!promoApplies) return { billingType: service.billingType, regular, promo: null, renewal: null };

  const promoUsd = discountedUsd(service.regularPriceUsd, status.discountPercent);
  const promo: Money = { amount: convertUsd(promoUsd, currency, amd), currency };
  return {
    billingType: service.billingType,
    regular,
    promo,
    renewal: service.billingType === "monthly" ? regular : null,
  };
}

/**
 * Amount billed for a given monthly invoice number (1 = first paid month) under the
 * campaign rule. Used by tests and quote summaries.
 */
export function monthlyInvoiceUsd(regularUsd: number, invoiceNumber: number, status: PromotionStatus): number {
  if (invoiceNumber < 1 || !Number.isInteger(invoiceNumber)) throw new Error("Invoice number starts at 1.");
  if (status.state === "active" && invoiceNumber === 1) return discountedUsd(regularUsd, status.discountPercent);
  return regularUsd;
}

/** "$790", "$323.90", "286,000 ֏". Cents are shown only when present, always as two digits. */
export function formatMoney(money: Money, locale = "en"): string {
  if (money.currency === "AMD") {
    return `${formatNumber(Math.round(money.amount), locale)} ֏`;
  }
  return formatUsd(money.amount, locale);
}
