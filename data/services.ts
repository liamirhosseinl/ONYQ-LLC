/**
 * ONYQ service catalogue — the single source of truth for prices.
 *
 * Seed catalogue: reference pricing page https://arevian.studio/price
 * ("prices valid from 23 September 2026"), re-checked live on 18 Oct 2026 — all 25
 * names, starting prices, timelines and billing types matched the ONYQ brief (Section 5).
 * Do not change a price here without written owner approval; record any change in
 * docs/pricing-and-promotion-rules.md.
 *
 * Names and descriptions are copy and live in content/<locale>/catalogue.ts.
 */

export type BillingType = "one_time" | "monthly";

export type CategoryId =
  | "websites"
  | "design"
  | "apps"
  | "ai"
  | "marketing"
  | "growth"
  | "support";

export type ServiceId =
  | "landing-page"
  | "website-redesign"
  | "business-website"
  | "corporate-website"
  | "online-store"
  | "web-portal"
  | "logo"
  | "brand-identity"
  | "ui-ux-design"
  | "ux-audit"
  | "telegram-bot"
  | "integrations-payments"
  | "crm-internal-systems"
  | "mobile-app"
  | "ai-assistant"
  | "ai-automation"
  | "seo"
  | "search-ads"
  | "smm"
  | "ai-search-visibility"
  | "website-audit"
  | "business-analytics"
  | "financial-model"
  | "gamification-loyalty"
  | "website-maintenance";

/** Indicative timeline. "monthly" = recurring service with no fixed delivery date. */
export type Timeline =
  | { kind: "days"; from: number }
  | { kind: "weeks"; from: number }
  | { kind: "months"; from: number }
  | { kind: "monthly" };

export interface ServicePrice {
  id: ServiceId;
  category: CategoryId;
  regularPriceUsd: number;
  billingType: BillingType;
  timeline: Timeline;
  /** Route of the most relevant detail page (service page or direction page). */
  detailPage: string;
  promoEligible: boolean;
  /** Third-party spend (e.g. ad budget) is billed separately and not part of the fee. */
  thirdPartySpendSeparate?: boolean;
  /** Shown in the "Most requested" receipt on the pricing page. */
  featured?: boolean;
}

export interface Category {
  id: CategoryId;
  anchor: string;
  /** Direction page explaining the area ("More about the service"). */
  directionPage: string;
}

export const categories: Category[] = [
  { id: "websites", anchor: "price-websites", directionPage: "/development" },
  { id: "design", anchor: "price-design", directionPage: "/design" },
  { id: "apps", anchor: "price-apps", directionPage: "/mobile-apps" },
  { id: "ai", anchor: "price-ai", directionPage: "/ai" },
  { id: "marketing", anchor: "price-marketing", directionPage: "/marketing" },
  { id: "growth", anchor: "price-growth", directionPage: "/business-analytics" },
  { id: "support", anchor: "price-support", directionPage: "/services/website-maintenance" },
];

export const services: ServicePrice[] = [
  // 01 Websites
  { id: "landing-page", category: "websites", regularPriceUsd: 790, billingType: "one_time", timeline: { kind: "days", from: 7 }, detailPage: "/services/landing-page", promoEligible: true, featured: true },
  { id: "website-redesign", category: "websites", regularPriceUsd: 890, billingType: "one_time", timeline: { kind: "weeks", from: 3 }, detailPage: "/services/website-redesign", promoEligible: true },
  { id: "business-website", category: "websites", regularPriceUsd: 1190, billingType: "one_time", timeline: { kind: "weeks", from: 2 }, detailPage: "/services/corporate-website", promoEligible: true },
  { id: "corporate-website", category: "websites", regularPriceUsd: 1990, billingType: "one_time", timeline: { kind: "weeks", from: 4 }, detailPage: "/services/corporate-website", promoEligible: true, featured: true },
  { id: "online-store", category: "websites", regularPriceUsd: 4900, billingType: "one_time", timeline: { kind: "weeks", from: 6 }, detailPage: "/services/online-store", promoEligible: true, featured: true },
  { id: "web-portal", category: "websites", regularPriceUsd: 9900, billingType: "one_time", timeline: { kind: "months", from: 2 }, detailPage: "/development", promoEligible: true },

  // 02 Design & brand
  { id: "logo", category: "design", regularPriceUsd: 390, billingType: "one_time", timeline: { kind: "days", from: 7 }, detailPage: "/services/branding", promoEligible: true },
  { id: "brand-identity", category: "design", regularPriceUsd: 1490, billingType: "one_time", timeline: { kind: "weeks", from: 3 }, detailPage: "/services/branding", promoEligible: true },
  { id: "ui-ux-design", category: "design", regularPriceUsd: 490, billingType: "one_time", timeline: { kind: "days", from: 10 }, detailPage: "/services/ux-ui-design", promoEligible: true },
  { id: "ux-audit", category: "design", regularPriceUsd: 290, billingType: "one_time", timeline: { kind: "days", from: 5 }, detailPage: "/services/ux-ui-design", promoEligible: true },

  // 03 Apps & bots
  { id: "telegram-bot", category: "apps", regularPriceUsd: 590, billingType: "one_time", timeline: { kind: "days", from: 10 }, detailPage: "/services/telegram-bot", promoEligible: true, featured: true },
  { id: "integrations-payments", category: "apps", regularPriceUsd: 290, billingType: "one_time", timeline: { kind: "days", from: 5 }, detailPage: "/services/integrations-payments", promoEligible: true },
  { id: "crm-internal-systems", category: "apps", regularPriceUsd: 5900, billingType: "one_time", timeline: { kind: "weeks", from: 6 }, detailPage: "/development", promoEligible: true },
  { id: "mobile-app", category: "apps", regularPriceUsd: 6900, billingType: "one_time", timeline: { kind: "months", from: 2 }, detailPage: "/mobile-apps", promoEligible: true },

  // 04 Artificial intelligence
  { id: "ai-assistant", category: "ai", regularPriceUsd: 990, billingType: "one_time", timeline: { kind: "weeks", from: 2 }, detailPage: "/services/ai-assistant", promoEligible: true },
  { id: "ai-automation", category: "ai", regularPriceUsd: 1990, billingType: "one_time", timeline: { kind: "weeks", from: 4 }, detailPage: "/services/ai-assistant", promoEligible: true },

  // 05 Marketing & promotion
  { id: "seo", category: "marketing", regularPriceUsd: 350, billingType: "monthly", timeline: { kind: "monthly" }, detailPage: "/services/seo", promoEligible: true, featured: true },
  { id: "search-ads", category: "marketing", regularPriceUsd: 390, billingType: "monthly", timeline: { kind: "monthly" }, detailPage: "/services/search-ads", promoEligible: true, thirdPartySpendSeparate: true },
  { id: "smm", category: "marketing", regularPriceUsd: 450, billingType: "monthly", timeline: { kind: "monthly" }, detailPage: "/services/smm", promoEligible: true, thirdPartySpendSeparate: true },
  { id: "ai-search-visibility", category: "marketing", regularPriceUsd: 590, billingType: "monthly", timeline: { kind: "monthly" }, detailPage: "/services/seo", promoEligible: true },
  { id: "website-audit", category: "marketing", regularPriceUsd: 250, billingType: "one_time", timeline: { kind: "days", from: 5 }, detailPage: "/services/website-audit", promoEligible: true },

  // 06 Analytics & growth
  { id: "business-analytics", category: "growth", regularPriceUsd: 990, billingType: "one_time", timeline: { kind: "weeks", from: 2 }, detailPage: "/business-analytics", promoEligible: true },
  { id: "financial-model", category: "growth", regularPriceUsd: 790, billingType: "one_time", timeline: { kind: "days", from: 10 }, detailPage: "/financial-consulting", promoEligible: true },
  { id: "gamification-loyalty", category: "growth", regularPriceUsd: 1490, billingType: "one_time", timeline: { kind: "weeks", from: 4 }, detailPage: "/gamification", promoEligible: true },

  // 07 Support
  { id: "website-maintenance", category: "support", regularPriceUsd: 99, billingType: "monthly", timeline: { kind: "monthly" }, detailPage: "/services/website-maintenance", promoEligible: true },
];

/**
 * Date from which ONYQ's public price list applies. [ONYQ INPUT REQUIRED]
 * (The reference catalogue states 23 Sep 2026 for its own prices; that date is not ONYQ's.)
 * While null, the pricing page shows no "valid from" line.
 */
export const PRICE_LIST_EFFECTIVE_FROM: string | null = null;

export function getService(id: ServiceId): ServicePrice {
  const service = services.find((s) => s.id === id);
  if (!service) throw new Error(`Unknown service id: ${id}`);
  return service;
}

export function servicesInCategory(category: CategoryId): ServicePrice[] {
  return services.filter((s) => s.category === category);
}
