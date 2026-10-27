import type { CategoryId, ServiceId } from "../../data/services.ts";

/**
 * Service names follow the approved seed catalogue (brief §5).
 * Short descriptions are original ONYQ copy describing the same factual scope.
 */
export const serviceCopy: Record<ServiceId, { name: string; short: string }> = {
  "landing-page": { name: "Landing page", short: "A single page for one product or campaign, with lead forms and analytics" },
  "website-redesign": { name: "Website redesign", short: "New design and build that keeps your page addresses and search positions" },
  "business-website": { name: "Business website", short: "Up to 5 pages: services, about and contacts, in up to three languages" },
  "corporate-website": { name: "Corporate website", short: "Service pages, news and careers, with an admin panel your team can edit" },
  "online-store": { name: "Online store", short: "Catalogue, cart, card and wallet payments, delivery and customer accounts" },
  "web-portal": { name: "Web service or portal", short: "Accounts, roles, payments and integrations, built around how you work" },
  logo: { name: "Logo", short: "Three directions, refinement of the chosen one, files for print and screen" },
  "brand-identity": { name: "Brand identity & brand book", short: "Logo, colour, type, collateral and usage rules gathered in one document" },
  "ui-ux-design": { name: "Website UI/UX design", short: "Structure, clickable prototype and layouts for phone and desktop" },
  "ux-audit": { name: "UX audit", short: "Where visitors drop off, with a prioritised list of fixes" },
  "telegram-bot": { name: "Telegram bot or mini app", short: "Requests, bookings, catalogue and payments inside Telegram" },
  "integrations-payments": { name: "Integrations & payments", short: "Card and wallet payments, CRM, 1C and accounting connections" },
  "crm-internal-systems": { name: "CRM & internal systems", short: "Leads, clients, tasks and money in one system shaped to your process" },
  "mobile-app": { name: "Mobile app", short: "iOS and Android from one codebase, published to the stores" },
  "ai-assistant": { name: "AI assistant for your website", short: "Answers from your own knowledge base, hands over to a person when unsure" },
  "ai-automation": { name: "AI integration & automation", short: "Leads, documents and mail processed automatically inside your systems" },
  seo: { name: "SEO", short: "Technical fixes, site structure, content and links" },
  "search-ads": { name: "Search & display ads", short: "Google Ads and Yandex Direct: setup, management and reporting" },
  smm: { name: "SMM & paid social", short: "Instagram, Facebook and Telegram: content plan, posts and ads" },
  "ai-search-visibility": { name: "AI search visibility", short: "Helping AI assistants such as ChatGPT, Gemini and Perplexity find and cite your company" },
  "website-audit": { name: "Website audit", short: "Speed, SEO, errors and conversion, with a plan of fixes" },
  "business-analytics": { name: "Business analytics & dashboards", short: "Sales, marketing and stock on one screen, refreshed automatically" },
  "financial-model": { name: "Financial model", short: "Unit economics, forecast and break-even for a decision or an investor" },
  "gamification-loyalty": { name: "Gamification & loyalty", short: "Rewards, levels and mechanics that bring customers back" },
  "website-maintenance": { name: "Website maintenance", short: "Updates, backups, monitoring and small edits" },
};

export const categoryCopy: Record<CategoryId, { title: string; lead: string }> = {
  websites: { title: "Websites", lead: "Custom design, fast pages and search foundations from the first release." },
  design: { title: "Design & brand", lead: "Identity and interfaces agreed before any code is written." },
  apps: { title: "Apps & bots", lead: "Mobile apps, Telegram bots and the internal systems behind them." },
  ai: { title: "Artificial intelligence", lead: "AI that works from your data and says so when it doesn't know." },
  marketing: { title: "Marketing & promotion", lead: "Monthly work measured in enquiries. Advertising budgets are paid separately." },
  growth: { title: "Analytics & growth", lead: "Numbers that show what works, and mechanics that bring customers back." },
  support: { title: "Support", lead: "After launch, someone keeps the site healthy." },
};
