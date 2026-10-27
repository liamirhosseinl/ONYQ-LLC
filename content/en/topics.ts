import type { ServiceId } from "../../data/services.ts";
import type { DirectionSlug } from "../../data/navigation.ts";

/**
 * Topic pages: the nine service directions plus About and How we work share one template,
 * following the reference direction pages (hero → interactive "explore this discipline" →
 * what's inside → services in this area → statement → where next → next step).
 * Original ONYQ copy. Principles avoid numbers and guarantees that ONYQ hasn't approved.
 */

export type TopicSlug = DirectionSlug | "about" | "how-we-work";

export interface Topic {
  slug: TopicSlug;
  index: string;
  label: string;
  meta: { title: string; description: string };
  title: [string, string];
  lead: string;
  approach: { kicker: string; flow: string; labels: [string, string, string] };
  areas: { title: string; body: string }[];
  services: ServiceId[];
  statement: string;
  principles: { title: string; body: string; approval?: "proposed" }[];
  next: { title: string; body: string };
  related: TopicSlug[];
}

export const topics: Record<TopicSlug, Topic> = {
  design: {
    slug: "design",
    index: "01",
    label: "Design",
    meta: {
      title: "Design: brand identity, UX/UI and design systems",
      description: "Logo and identity from $390, website UI/UX design from $490, UX audits from $290. Identity, interfaces, design systems and motion by ONYQ.",
    },
    title: ["Design that", "earns trust."],
    lead: "Identity, interfaces and motion for businesses that should look like the best in their field — not like a template.",
    approach: { kicker: "Our approach", flow: "character → system → screens", labels: ["Identity", "Interface", "Motion"] },
    areas: [
      { title: "Brand identity", body: "Logo, palette, typography and tone of voice — a system your team can actually use, not a one-off picture." },
      { title: "Product interfaces", body: "Web and mobile interfaces built around real user journeys and handed over as components ready for development." },
      { title: "Design systems", body: "Tokens, states and rules that keep every new screen consistent as the product grows." },
      { title: "Motion", body: "Scroll choreography and micro-interactions that make a site feel considered without slowing it down." },
    ],
    services: ["logo", "brand-identity", "ui-ux-design", "ux-audit"],
    statement: "Design isn’t decoration. It is the shortest path to a decision.",
    principles: [
      { title: "Agreed before code", body: "Structure and layouts are approved before development starts." },
      { title: "Every state drawn", body: "Errors, empty screens and loading are designed, not improvised later." },
      { title: "Ready to build", body: "Components and spacing are documented for whoever develops them." },
    ],
    next: { title: "Need a brand people trust?", body: "Tell ONYQ about the product and get a scope and an estimate." },
    related: ["development", "ai", "marketing", "business-analytics"],
  },
  development: {
    slug: "development",
    index: "02",
    label: "Development",
    meta: {
      title: "Development: websites, online stores, web apps and integrations",
      description: "Landing pages from $790, corporate websites from $1,990, online stores from $4,900, web portals from $9,900, CRM and internal systems from $5,900.",
    },
    title: ["Built to", "perform."],
    lead: "Websites, web apps, bots and integrations on a modern stack — fast, measurable and easy to change after launch.",
    approach: { kicker: "Our approach", flow: "idea → live", labels: ["Web", "Backend", "Integrations"] },
    areas: [
      { title: "Marketing websites", body: "Image and font budgets under control, with SEO and analytics wired in from the first release." },
      { title: "Web applications", body: "Portals, dashboards and internal tools with accounts, roles and payments." },
      { title: "Telegram bots & mini apps", body: "Ordering, bookings, support and notifications inside the messenger your customers already use." },
      { title: "Infrastructure", body: "Deployment, monitoring and backups, so releases are uneventful and nights are quiet." },
    ],
    services: ["landing-page", "business-website", "corporate-website", "online-store", "web-portal", "website-redesign", "integrations-payments", "crm-internal-systems", "website-maintenance"],
    statement: "Code another team could pick up without an apology.",
    principles: [
      { title: "Fast by default", body: "Performance budgets are set at the start, not fixed at the end." },
      { title: "Measured from launch", body: "Analytics and goals ship with the first version." },
      { title: "Yours to keep", body: "Code, servers and accounts are registered to you." },
    ],
    next: { title: "Have something to build?", body: "Describe the goal and get a scope, a timeline and a price." },
    related: ["design", "ai", "mobile-apps", "business-analytics"],
  },
  ai: {
    slug: "ai",
    index: "04",
    label: "AI",
    meta: {
      title: "AI assistants, integration and automation for business",
      description: "AI assistants that answer from your own knowledge base from $990; AI integration and process automation from $1,990.",
    },
    title: ["AI that does", "real work."],
    lead: "Assistants, agents and automation that take routine off your team — judged by the hours they save, not by the hype.",
    approach: { kicker: "Our approach", flow: "AI × people", labels: ["Assistants", "Automation", "Agents"] },
    areas: [
      { title: "Assistants & agents", body: "Support, sales and internal helpers that work from your own documents and processes." },
      { title: "Process automation", body: "Document handling, data entry and reporting that run without someone copying and pasting." },
      { title: "Integrations", body: "AI connected to the tools you already use: CRM, mail, Telegram, your database." },
      { title: "Audit & strategy", body: "Finding where AI actually pays off in your company — and where it doesn’t." },
    ],
    services: ["ai-assistant", "ai-automation"],
    statement: "AI is useful when it removes work, not when it adds a chat window.",
    principles: [
      { title: "Audit first", body: "Nothing is built until the expected benefit is clear." },
      { title: "Answers from your data", body: "Assistants are limited to sources you approve." },
      { title: "Private options", body: "Deployment on your own server is possible when data must stay with you." },
    ],
    next: { title: "Where would AI pay off for you?", body: "Describe the routine work and get a view on what is worth automating first." },
    related: ["development", "business-analytics", "design", "marketing"],
  },
  "mobile-apps": {
    slug: "mobile-apps",
    index: "03",
    label: "Mobile apps",
    meta: {
      title: "Mobile app development for iOS and Android — from $6,900",
      description: "iOS and Android apps from one codebase with backend, store publishing and updates, from $6,900. Telegram bots and mini apps from $590.",
    },
    title: ["Apps people", "keep."],
    lead: "iOS and Android products from the first prototype to the store, with the backend behind them.",
    approach: { kicker: "Our approach", flow: "web ↔ app", labels: ["iOS", "Android", "Mini apps"] },
    areas: [
      { title: "Product design", body: "Flows and screens designed for a thumb, not for a desktop mock-up." },
      { title: "Cross-platform", body: "One codebase for iOS and Android where it makes sense." },
      { title: "Backend & API", body: "Accounts, payments, notifications and an admin panel built together with the app." },
      { title: "Release & updates", body: "Store publishing, crash monitoring and a plan for updates after launch." },
    ],
    services: ["mobile-app", "telegram-bot"],
    statement: "An app people open on purpose — not because a notification told them to.",
    principles: [
      { title: "Both platforms", body: "iOS and Android from one plan and one codebase." },
      { title: "Backend included", body: "The server side is designed with the app, not bolted on." },
      { title: "Life after release", body: "Monitoring and updates are planned before launch." },
    ],
    next: { title: "Have an app idea?", body: "Scope a first version that can reach the stores quickly." },
    related: ["development", "design", "gamification", "ai"],
  },
  marketing: {
    slug: "marketing",
    index: "05",
    label: "Marketing",
    meta: {
      title: "Marketing: SEO, search ads, SMM and website audits",
      description: "SEO from $350/month, search and display ads from $390/month, SMM from $450/month, AI search visibility from $590/month, website audits from $250.",
    },
    title: ["Traffic that turns", "into customers."],
    lead: "Positioning, channels and creative built around your numbers — not around vanity metrics.",
    approach: { kicker: "Our approach", flow: "insight → action", labels: ["Search", "Social", "Analytics"] },
    areas: [
      { title: "Positioning", body: "What you sell, to whom and why they should choose you — settled before money goes into ads." },
      { title: "SEO & content", body: "Technical SEO and content that keeps bringing customers after the ad budget stops." },
      { title: "Creative", body: "Landing pages, banners and posts made by the same team that shaped your brand." },
      { title: "Performance", body: "Paid channels with honest attribution: what each enquiry costs and what it brings back." },
    ],
    services: ["seo", "search-ads", "smm", "ai-search-visibility", "website-audit"],
    statement: "Reach is a means. Enquiries are the measure.",
    principles: [
      { title: "Monthly and transparent", body: "A report and a plan every month." },
      { title: "Budgets stay yours", body: "Ad spend is paid directly to the platforms, from your accounts." },
      { title: "Three languages", body: "Queries and copy in Armenian, Russian and English." },
    ],
    next: { title: "Need more customers?", body: "Tell ONYQ where they come from today and get a plan for the next channel." },
    related: ["design", "business-analytics", "development", "ai"],
  },
  content: {
    slug: "content",
    index: "06",
    label: "Content & video",
    meta: {
      title: "Content production and video editing: reels, Shorts and content strategy",
      description: "Short-form video editing, reels, TikToks and Shorts, scripts and content strategy, sound design and motion graphics — edited for retention.",
    },
    title: ["Content that makes", "people stop."],
    lead: "Short-form video, editing and content strategy — hooks that land in the first three seconds and pacing that holds attention to the end.",
    approach: { kicker: "Our approach", flow: "hook → pace → retain", labels: ["Script", "Edit", "Sound"] },
    areas: [
      { title: "Short-form editing", body: "Reels, TikToks and Shorts cut for retention: a clear hook, captions that read at a glance and pacing where every cut earns its place." },
      { title: "Content strategy", body: "Scripts, storyboards and a publishing rhythm planned before the shoot, so the edit has something strong to carry." },
      { title: "Sound & motion", body: "Voice clean-up, layered sound effects and motion graphics built into the first pass — not added at the end." },
      { title: "Every format", body: "Podcast cut-downs, real-estate breakdowns, event recaps, UGC and ads — each with its own rhythm." },
    ],
    services: [],
    statement: "The first three seconds decide everything.",
    principles: [
      { title: "Built for retention", body: "Every edit is planned around the hook and tuned against how people actually watch." },
      { title: "A steady rhythm", body: "Reels and Shorts delivered on a regular schedule, on tight deadlines." },
      { title: "Script to sound", body: "Script, edit, captions, sound and motion handled by one team." },
    ],
    next: { title: "Got footage that needs to stop the scroll?", body: "Send ONYQ a short brief with the format and the goal — the reply comes with a first plan and timing." },
    related: ["marketing", "design", "ai", "development"],
  },
  gamification: {
    slug: "gamification",
    index: "07",
    label: "Gamification",
    meta: {
      title: "Gamification and loyalty programmes — from $1,490",
      description: "Rewards, levels and loyalty mechanics that bring customers back, designed and built from $1,490, from 4 weeks.",
    },
    title: ["Engagement", "by design."],
    lead: "Points, levels, challenges and rewards that make people come back — built on behavioural mechanics, not on noise.",
    approach: { kicker: "Our approach", flow: "progress → reward → return", labels: ["Progress", "Rewards", "Retention"] },
    areas: [
      { title: "Mechanics", body: "Progress, streaks and rewards built around what your customers actually value." },
      { title: "Loyalty programmes", body: "Bonus systems and tiers that encourage repeat purchases without eroding margin." },
      { title: "Interfaces", body: "Feedback and animation that make progress feel satisfying rather than noisy." },
      { title: "Analytics", body: "Retention and engagement measured before and after, so you know whether it worked." },
    ],
    services: ["gamification-loyalty"],
    statement: "People finish what feels like a game and abandon what feels like a form.",
    principles: [
      { title: "Retention first", body: "Mechanics are judged by whether people return." },
      { title: "Tested on data", body: "Ideas are checked against behaviour, not taste." },
      { title: "Fits your product", body: "Built into what you already run, not as a separate app." },
    ],
    next: { title: "Want customers to come back?", body: "Describe your product and audience and get a first set of mechanics to test." },
    related: ["mobile-apps", "business-analytics", "design", "marketing"],
  },
  "business-analytics": {
    slug: "business-analytics",
    index: "08",
    label: "Business analytics",
    meta: {
      title: "Business analytics and dashboards — from $990",
      description: "Dashboards that bring sales, marketing and stock onto one screen from $990, and financial models from $790.",
    },
    title: ["Decisions based", "on numbers."],
    lead: "Dashboards, unit economics and reporting that show what really drives your revenue — and what quietly drains it.",
    approach: { kicker: "Our approach", flow: "insight → action", labels: ["Metrics", "Dashboards", "Unit economics"] },
    areas: [
      { title: "Metrics & dashboards", body: "One place where sales, marketing and product numbers finally agree." },
      { title: "Unit economics", body: "Acquisition cost, lifetime value and margin per product and channel — the model behind growth decisions." },
      { title: "Funnel analysis", body: "Where people drop off, what it costs and which fix returns the most." },
      { title: "Reporting automation", body: "Reports that build themselves instead of living in someone’s spreadsheet." },
    ],
    services: ["business-analytics", "financial-model"],
    statement: "Numbers first, opinions second.",
    principles: [
      { title: "One source of truth", body: "Everyone looks at the same numbers." },
      { title: "No manual reports", body: "Data refreshes automatically." },
      { title: "Tied to decisions", body: "Every metric answers a question someone actually asks." },
    ],
    next: { title: "Not sure which numbers to trust?", body: "Describe what you measure today and get a proposal for the dashboard you need." },
    related: ["financial-consulting", "marketing", "ai", "development"],
  },
  "financial-consulting": {
    slug: "financial-consulting",
    index: "09",
    label: "Financial consulting",
    meta: {
      title: "Financial models: unit economics, forecast and break-even — from $790",
      description: "A financial model with unit economics, forecast and break-even for a decision or an investor, from $790, from 10 days.",
    },
    title: ["Numbers you", "can defend."],
    lead: "Financial models that show unit economics, a forecast and the break-even point — for a decision, a budget or an investor conversation.",
    approach: { kicker: "Our approach", flow: "assumptions → model → decision", labels: ["Unit economics", "Forecast", "Scenarios"] },
    areas: [
      { title: "Unit economics", body: "What one customer, order or product really earns once every cost is counted." },
      { title: "Forecast", body: "Revenue, costs and hiring laid out month by month from clear assumptions." },
      { title: "Break-even & scenarios", body: "When the business pays for itself, and how that changes if the assumptions do." },
      { title: "A model you can update", body: "Built so your team can change the inputs and keep using it." },
    ],
    services: ["financial-model", "business-analytics"],
    statement: "A plan is only useful if you can defend it.",
    principles: [
      { title: "Assumptions in plain view", body: "Every number traces back to an input you can change." },
      { title: "Scenarios, not one guess", body: "Best, expected and cautious cases side by side." },
      { title: "Yours to run", body: "Handed over in a format your team can maintain." },
    ],
    next: { title: "Preparing a decision or a pitch?", body: "Describe the business model and get a scope for the financial model." },
    related: ["business-analytics", "ai", "marketing", "development"],
  },
  about: {
    slug: "about",
    index: "—",
    label: "About ONYQ",
    meta: {
      title: "About ONYQ — software company registered in Armenia",
      description: "ONYQ is a software company registered in Armenia that designs and builds websites, apps, AI tools and marketing systems for business.",
    },
    title: ["The digital side", "of your business."],
    lead: "ONYQ is a software company registered in Armenia. We design and build websites, online stores, apps and AI tools, and run the marketing that brings them customers.",
    approach: { kicker: "What ONYQ brings together", flow: "design → engineering → growth", labels: ["Design", "Engineering", "Growth"] },
    areas: [
      { title: "Design", body: "Identity and interfaces that make a business recognisable and easy to use." },
      { title: "Engineering", body: "Websites, stores, web apps, bots and the integrations that connect them." },
      { title: "Intelligence", body: "AI assistants, automation and analytics built on your own data." },
      { title: "Growth", body: "SEO, advertising and social media measured in enquiries." },
    ],
    services: ["landing-page", "corporate-website", "online-store", "ai-assistant", "seo", "website-maintenance"],
    statement: "Your digital side, handled — so your attention stays on the business.",
    principles: [
      { title: "One team, one context", body: "Design, engineering, AI and marketing planned together." },
      { title: "Agree before building", body: "Scope and design are settled before development starts." },
      { title: "Measure from the first day", body: "Every launch ships with analytics." },
    ],
    next: { title: "Want to work together?", body: "Start with a short brief — the first answers shape the scope." },
    related: ["how-we-work", "design", "development", "ai"],
  },
  "how-we-work": {
    slug: "how-we-work",
    index: "—",
    label: "How we work",
    meta: {
      title: "How ONYQ works: brief, design, build, launch",
      description: "How a project with ONYQ runs: a short brief, design agreed before development, a build shown as it takes shape, launch and support.",
    },
    title: ["A process without", "surprises."],
    lead: "Agreed scope, visible progress and a working version at every stage — so you always know where the project stands.",
    approach: { kicker: "How we work", flow: "brief → design → build → launch", labels: ["Discovery", "Build", "Handover"] },
    areas: [
      { title: "Discovery", body: "We start with your goals and numbers: what the product must achieve, not only how it should look." },
      { title: "Design", body: "Identity and interfaces are approved before development, so the build never redoes the work." },
      { title: "Build", body: "Parts are delivered one by one, each shown working so you can click through it yourself." },
      { title: "Launch & support", body: "Publishing, monitoring and a team that stays available after release." },
    ],
    services: ["landing-page", "corporate-website", "online-store", "website-maintenance"],
    statement: "You see the project the way we see it.",
    principles: [
      { title: "Scope in writing", body: "Scope, timeline and price are agreed in writing before work starts." },
      { title: "Payment by stages", body: "Payments follow a schedule agreed upfront." },
      { title: "Regular demos", body: "Progress is shown on a working version, not in status messages." },
    ],
    next: { title: "Have a project in mind?", body: "Describe the goal and get a scope, a timeline and a price." },
    related: ["about", "design", "development", "marketing"],
  },
};

export function getTopic(slug: TopicSlug): Topic {
  return topics[slug];
}
