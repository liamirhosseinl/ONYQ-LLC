import { test } from "node:test";
import assert from "node:assert/strict";
import { services, type ServiceId } from "../../data/services.ts";
import { promotion as productionPromotion, type PromotionConfig } from "../../data/promotion.ts";
import { amdPolicy } from "../../data/currency.ts";
import {
  convertUsd,
  discountedUsd,
  formatMoney,
  getPromotionStatus,
  monthlyInvoiceUsd,
  quoteService,
} from "../../lib/pricing.ts";
import { zonedTimeToUtc, formatZoned } from "../../lib/zoned-time.ts";

/** Brief §5 — approved seed catalogue and the approved −59% table. */
const APPROVED: Record<ServiceId, { regular: number; promo: number; billing: "one_time" | "monthly" }> = {
  "landing-page": { regular: 790, promo: 323.9, billing: "one_time" },
  "website-redesign": { regular: 890, promo: 364.9, billing: "one_time" },
  "business-website": { regular: 1190, promo: 487.9, billing: "one_time" },
  "corporate-website": { regular: 1990, promo: 815.9, billing: "one_time" },
  "online-store": { regular: 4900, promo: 2009.0, billing: "one_time" },
  "web-portal": { regular: 9900, promo: 4059.0, billing: "one_time" },
  logo: { regular: 390, promo: 159.9, billing: "one_time" },
  "brand-identity": { regular: 1490, promo: 610.9, billing: "one_time" },
  "ui-ux-design": { regular: 490, promo: 200.9, billing: "one_time" },
  "ux-audit": { regular: 290, promo: 118.9, billing: "one_time" },
  "telegram-bot": { regular: 590, promo: 241.9, billing: "one_time" },
  "integrations-payments": { regular: 290, promo: 118.9, billing: "one_time" },
  "crm-internal-systems": { regular: 5900, promo: 2419.0, billing: "one_time" },
  "mobile-app": { regular: 6900, promo: 2829.0, billing: "one_time" },
  "ai-assistant": { regular: 990, promo: 405.9, billing: "one_time" },
  "ai-automation": { regular: 1990, promo: 815.9, billing: "one_time" },
  seo: { regular: 350, promo: 143.5, billing: "monthly" },
  "search-ads": { regular: 390, promo: 159.9, billing: "monthly" },
  smm: { regular: 450, promo: 184.5, billing: "monthly" },
  "ai-search-visibility": { regular: 590, promo: 241.9, billing: "monthly" },
  "website-audit": { regular: 250, promo: 102.5, billing: "one_time" },
  "business-analytics": { regular: 990, promo: 405.9, billing: "one_time" },
  "financial-model": { regular: 790, promo: 323.9, billing: "one_time" },
  "gamification-loyalty": { regular: 1490, promo: 610.9, billing: "one_time" },
  "website-maintenance": { regular: 99, promo: 40.59, billing: "monthly" },
};

const campaign: PromotionConfig = {
  ...productionPromotion,
  enabled: true,
  startLocal: "2026-11-01 00:00",
  endLocal: "2026-11-30 23:59",
};
const START = new Date("2026-10-31T20:00:00.000Z"); // 00:00 Yerevan (UTC+4)
const END = new Date("2026-11-30T19:59:00.000Z"); // 23:59 Yerevan

test("catalogue has exactly the 25 approved services with approved prices and billing", () => {
  assert.equal(services.length, 25);
  assert.deepEqual(new Set(services.map((s) => s.id)), new Set(Object.keys(APPROVED)));
  for (const s of services) {
    assert.equal(s.regularPriceUsd, APPROVED[s.id].regular, s.id);
    assert.equal(s.billingType, APPROVED[s.id].billing, s.id);
  }
});

test("59% promo amounts match the approved table for every service", () => {
  for (const s of services) {
    assert.equal(discountedUsd(s.regularPriceUsd, 59), APPROVED[s.id].promo, s.id);
  }
});

test("production config ships with the promotion disabled", () => {
  assert.equal(productionPromotion.enabled, false);
  assert.equal(productionPromotion.timezone, "Asia/Yerevan");
  assert.equal(productionPromotion.discountPercent, 59);
});

test("disabled or unconfigured promotion → regular price only", () => {
  const now = new Date("2026-11-15T12:00:00Z");
  const disabled = getPromotionStatus(productionPromotion, now);
  assert.equal(disabled.state, "disabled");
  const unconfigured = getPromotionStatus({ ...productionPromotion, enabled: true }, now);
  assert.equal(unconfigured.state, "unconfigured");
  for (const status of [disabled, unconfigured]) {
    const q = quoteService(services[0], status, "USD", amdPolicy);
    assert.equal(q.promo, null);
    assert.equal(q.regular.amount, 790);
  }
});

test("Asia/Yerevan wall-clock times resolve to the right instants", () => {
  assert.equal(zonedTimeToUtc("2026-11-01 00:00", "Asia/Yerevan").toISOString(), START.toISOString());
  assert.equal(zonedTimeToUtc("2026-11-30 23:59", "Asia/Yerevan").toISOString(), END.toISOString());
  assert.equal(formatZoned(START, "Asia/Yerevan"), "2026-11-01 00:00");
  assert.throws(() => zonedTimeToUtc("2026-02-31 10:00", "Asia/Yerevan"));
  assert.throws(() => zonedTimeToUtc("1 Nov 2026", "Asia/Yerevan"));
});

test("before start → regular price (scheduled)", () => {
  const status = getPromotionStatus(campaign, new Date(START.getTime() - 1));
  assert.equal(status.state, "scheduled");
  assert.equal(quoteService(services[0], status, "USD", amdPolicy).promo, null);
  assert.equal(status.nextChangeAt?.toISOString(), START.toISOString());
});

test("exactly at start → promo price", () => {
  const status = getPromotionStatus(campaign, START);
  assert.equal(status.state, "active");
  assert.equal(quoteService(services[0], status, "USD", amdPolicy).promo?.amount, 323.9);
});

test("during campaign → promo price for every eligible service", () => {
  const status = getPromotionStatus(campaign, new Date("2026-11-15T09:30:00Z"));
  assert.equal(status.state, "active");
  for (const s of services) {
    assert.equal(quoteService(s, status, "USD", amdPolicy).promo?.amount, APPROVED[s.id].promo, s.id);
  }
});

test("end boundary is exclusive: one ms before → promo; exactly at end → regular", () => {
  assert.equal(getPromotionStatus(campaign, new Date(END.getTime() - 1)).state, "active");
  const atEnd = getPromotionStatus(campaign, END);
  assert.equal(atEnd.state, "ended");
  assert.equal(quoteService(services[0], atEnd, "USD", amdPolicy).promo, null);
});

test("immediately after expiry → regular price, no next change", () => {
  const status = getPromotionStatus(campaign, new Date(END.getTime() + 1000));
  assert.equal(status.state, "ended");
  assert.equal(status.nextChangeAt, null);
});

test("monthly services: first paid month discounted, later invoices regular", () => {
  const active = getPromotionStatus(campaign, new Date("2026-11-10T10:00:00Z"));
  assert.equal(monthlyInvoiceUsd(350, 1, active), 143.5);
  assert.equal(monthlyInvoiceUsd(350, 2, active), 350);
  assert.equal(monthlyInvoiceUsd(350, 12, active), 350);
  assert.equal(monthlyInvoiceUsd(99, 1, active), 40.59);
  const seo = services.find((s) => s.id === "seo")!;
  const q = quoteService(seo, active, "USD", amdPolicy);
  assert.equal(q.promo?.amount, 143.5);
  assert.equal(q.renewal?.amount, 350);
  const oneTime = quoteService(services[0], active, "USD", amdPolicy);
  assert.equal(oneTime.renewal, null);
});

test("an inverted campaign window is rejected", () => {
  assert.throws(() =>
    getPromotionStatus({ ...campaign, startLocal: "2026-12-01 00:00", endLocal: "2026-11-01 00:00" }, START),
  );
});

test("AMD conversion uses one rate and rounds to the nearest 1,000 ֏", () => {
  assert.equal(convertUsd(790, "AMD", amdPolicy), 286000); // 285,980
  assert.equal(convertUsd(99, "AMD", amdPolicy), 36000); // 35,838
  assert.equal(convertUsd(323.9, "AMD", amdPolicy), 117000); // 117,251.8
  assert.equal(convertUsd(9900, "AMD", amdPolicy), 3584000); // 3,583,800
  assert.equal(convertUsd(790, "USD", amdPolicy), 790);
});

test("money formatting", () => {
  assert.equal(formatMoney({ amount: 790, currency: "USD" }), "$790");
  assert.equal(formatMoney({ amount: 1990, currency: "USD" }), "$1,990");
  assert.equal(formatMoney({ amount: 323.9, currency: "USD" }), "$323.90");
  assert.equal(formatMoney({ amount: 40.59, currency: "USD" }), "$40.59");
  assert.equal(formatMoney({ amount: 2009, currency: "USD" }), "$2,009");
  assert.equal(formatMoney({ amount: 286000, currency: "AMD" }), "286,000 ֏");
});
