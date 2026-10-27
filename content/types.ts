/**
 * Content shapes. English modules define them; Russian and Armenian modules are typed
 * against them, so a missing or misspelt field fails the type check.
 */
import type { home } from "./en/home.ts";
import type { faqPage, contactsPage, portfolioPage } from "./en/pages.ts";
import type { pricingPage } from "./en/pricing.ts";

export type { ServicePage, FaqItem } from "./en/service-pages.ts";
export type { Topic, TopicSlug } from "./en/topics.ts";
export type { Concept } from "./en/pages.ts";

export type HomeContent = typeof home;
export type FaqPageContent = typeof faqPage;
export type ContactsPageContent = typeof contactsPage;
export type PortfolioPageContent = typeof portfolioPage;
export type PricingPageContent = typeof pricingPage;

export interface CaseCopy {
  name: string;
  industry: string;
  teaser: string;
  summary: string;
  challenge: string;
  approach: string;
  scope: string[];
  result: string;
  metricLabel: string;
  tags: string[];
  /** Alt text per gallery image key (data/cases.ts → CaseImage.alt). */
  alts: Record<string, string>;
}

export type CasesContent = Record<string, CaseCopy>;
