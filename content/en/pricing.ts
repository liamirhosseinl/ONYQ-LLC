import type { FaqItem } from "./service-pages.ts";

export const pricingPage = {
  meta: {
    title: "Prices for websites, design, apps, AI and marketing",
    description:
      "ONYQ starting prices: landing pages from $790, corporate websites from $1,990, online stores from $4,900, Telegram bots from $590, AI assistants from $990, SEO from $350/month.",
  },
  hero: {
    title: ["Pricing for websites,", "design and AI."] as [string, string],
    lead: "Starting prices for a typical scope. The exact price and timeline are agreed after a short brief, before any work begins.",
    cta: "Estimate my project",
  },
  inEveryPrice: {
    title: "Always included",
    items: [
      { title: "Agreed", body: "Scope, timeline and price in writing before work starts." },
      { title: "By stages", body: "Payment on a schedule agreed upfront." },
      { title: "Visible", body: "Regular demos of what has been built." },
      { title: "Yours", body: "Code, accounts and rights stay with you after payment." },
    ],
  },
  dependsOn: {
    title: "What moves the price",
    items: [
      { title: "Scope", body: "The number of pages, screens and flows. A catalogue of 30 products and one of 3,000 are different jobs." },
      { title: "Integrations", body: "Payments, CRM, 1C, stock and delivery. Each system means its own data exchange and its own testing." },
      { title: "Content", body: "Whether copy, photos and translations are ready. They can be prepared too, as a separate line in the estimate." },
      { title: "Timeline", body: "An urgent launch needs several people working in parallel, and that costs more." },
    ],
  },
  faq: [
    {
      q: "Why are prices shown as “from”?",
      a: "Because projects differ. The starting price covers a typical scope for that service; your price depends on the number of pages, integrations, languages and how ready the content is.",
    },
    {
      q: "Can the price change along the way?",
      a: "Only if the scope changes. Any change is estimated and agreed with you before it is done.",
    },
    {
      q: "How does payment work?",
      a: "In stages, on a schedule agreed before the project starts.",
    },
    {
      q: "What does a website price include?",
      a: "Design, development, layouts for phone and desktop, basic SEO, analytics and publishing. Each service page lists exactly what its starting price covers.",
    },
    {
      q: "Why not just use a website builder — isn’t it cheaper?",
      a: "For a simple page it can be. A custom build pays off when speed, search visibility, integrations or a distinctive design matter — and when you want to own the result rather than rent it.",
    },
    {
      q: "Who owns the result?",
      a: "Once the work is paid for, code, source files and accounts are yours.",
    },
    {
      q: "Do you work with clients outside Armenia?",
      a: "Yes. Work runs online, with sites delivered in English, Russian and Armenian as needed.",
    },
    {
      q: "Are advertising budgets included in marketing prices?",
      a: "No. Monthly prices for search ads and paid social cover management. The advertising budget is paid directly to the ad platforms.",
    },
  ] satisfies FaqItem[],
  next: {
    title: "Let’s price your project",
    body: "Answer a few questions about what you are building and get a scope, a timeline and a price.",
  },
};
