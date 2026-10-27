import type { ServiceId } from "../../data/services.ts";
import type { DirectionSlug } from "../../data/navigation.ts";

/**
 * Service detail pages (/services/[slug]).
 *
 * Factual scope (what is included, stages, fit / not-fit) was extracted from the matching
 * reference service pages on 18 Oct 2026 (see docs/service-content-inventory.md) and rewritten
 * as original ONYQ copy. Stage durations are indicative and add up to the approved
 * "from" timeline. Items marked approval: "proposed" describe ONYQ commercial terms that the
 * owner still has to confirm; they are hidden in production mode.
 */

export interface FaqItem {
  q: string;
  a: string;
  approval?: "approved" | "proposed";
}

export interface ServicePage {
  slug: string;
  direction: DirectionSlug;
  /** Price shown in the estimate card. */
  primary: ServiceId;
  /** Price rows listed on the page (primary first). */
  priceIds: ServiceId[];
  meta: { title: string; description: string };
  label: string;
  title: string;
  lead: string;
  included: string[];
  benefits: { title: string; body: string }[];
  process: { title: string; duration: string; body: string }[];
  fit: string[];
  notFit: { text: string; alt: ServiceId }[];
  faq: FaqItem[];
  seeAlso: ServiceId[];
}

const OWNERSHIP: FaqItem = {
  q: "Who owns the result?",
  a: "Once the work is paid for, the code, source files and accounts are yours, registered in your company’s name.",
};

export const servicePages: ServicePage[] = [
  {
    slug: "landing-page",
    direction: "development",
    primary: "landing-page",
    priceIds: ["landing-page", "ui-ux-design", "search-ads"],
    meta: {
      title: "Landing page design and development — from $790",
      description: "A single page built to turn ad clicks into enquiries: custom design, phone and desktop layouts, lead forms and analytics. From $790, from 7 days.",
    },
    label: "Landing page",
    title: "A landing page with one job: turning a click into an enquiry.",
    lead: "One page for one offer. The structure follows the questions your customers actually ask, the design is drawn from scratch, and the page loads quickly on mobile data.",
    included: [
      "Page structure and copy built around customer questions",
      "Custom design — not a builder template",
      "Layouts for phone and desktop",
      "Forms delivered to email, Telegram or your CRM",
      "Analytics with goals for every form and button",
      "Basic SEO: titles, descriptions, structured markup",
      "Up to three languages: English, Russian, Armenian",
      "Publishing on hosting and handover of access",
    ],
    benefits: [
      { title: "Enquiries, not just visits", body: "Every block leads to one action: a form, a call or a message. Enquiries arrive where your team already works." },
      { title: "Cheaper clicks", body: "A fast page whose headline matches the search query tends to earn a better ad quality score, so the same click costs less." },
      { title: "Numbers from day one", body: "Analytics and goals are set up before launch: how many people came, from where, and how many got in touch." },
    ],
    process: [
      { title: "Brief", duration: "1–2 days", body: "The product, the audience and where traffic will come from. Result: a block-by-block structure of the page." },
      { title: "Design", duration: "2–3 days", body: "Phone and desktop layouts. You see the whole page before development starts." },
      { title: "Build", duration: "2–4 days", body: "Development, forms, analytics and translations. Speed and every form submission are tested." },
      { title: "Launch", duration: "1 day", body: "Publishing on your domain, connecting ads and handing over access." },
    ],
    fit: [
      "You advertise one product, offer or event",
      "You want to test demand for an idea before building a full site",
      "You need a lead page within two weeks",
    ],
    notFit: [
      { text: "You offer several services and each needs its own page in search — a corporate website fits better.", alt: "corporate-website" },
      { text: "You need a catalogue, a cart and online payment — that is an online store.", alt: "online-store" },
    ],
    faq: [
      { q: "How much does a landing page cost?", a: "From $790 for a typical scope. The final price depends on the number of blocks, languages, integrations and whether copy and images are ready." },
      { q: "How long does it take?", a: "From 7 days for a typical page, if the content is ready and feedback comes quickly." },
      { q: "Landing page or business website — which one?", a: "A landing page sells one offer to one audience. If you have several services that people search for separately, a business or corporate website gives each its own page." },
      { q: "Can the landing page grow into a full website later?", a: "Yes. The page is built on the same foundations as a multi-page site, so new pages can be added without starting again." },
      OWNERSHIP,
    ],
    seeAlso: ["corporate-website", "search-ads", "website-audit", "logo"],
  },
  {
    slug: "website-redesign",
    direction: "development",
    primary: "website-redesign",
    priceIds: ["website-redesign", "website-audit", "ui-ux-design"],
    meta: {
      title: "Website redesign without losing search positions — from $890",
      description: "New design and build while page addresses, titles and search positions are preserved. Redirect map, mobile-first layouts, analytics carried over. From $890.",
    },
    label: "Website redesign",
    title: "A website redesign that keeps what search engines already know.",
    lead: "New design and new code, while page addresses, titles and markup stay put wherever possible. Old and new URLs are mapped before launch, and indexing is checked after it — the site changes for people, quietly for search.",
    included: [
      "Review of the current site, analytics and search positions",
      "A map of old and new page addresses",
      "New design for phone and desktop",
      "A fast, modern build",
      "Migration of copy, meta tags and markup",
      "301 redirects for addresses that change",
      "Analytics and goals carried over without gaps",
      "Indexing and error check after launch",
    ],
    benefits: [
      { title: "Search keeps finding you", body: "Addresses are kept where possible and moved with redirects where not. Titles, descriptions and markup travel with their pages." },
      { title: "Comfortable on a phone", body: "Mobile-first design, quick loading and clear navigation, so a customer reaches a service or your contacts in a couple of taps." },
      { title: "Changes based on data", body: "The work starts with what the current site does well and where people drop off. What works stays; what gets in the way goes." },
    ],
    process: [
      { title: "Review", duration: "3–5 days", body: "Analytics and Search Console: which pages bring traffic and enquiries, and which addresses must not be lost." },
      { title: "Design", duration: "1–1.5 weeks", body: "New phone and desktop layouts based on the review, agreed before development starts." },
      { title: "Build and migration", duration: "1–1.5 weeks", body: "Development, content and meta-tag migration, redirects — on a test address hidden from search." },
      { title: "Launch and check", duration: "2–3 days", body: "The new version goes live, the sitemap is submitted and redirects and errors are checked, then indexing is reviewed again a few weeks later." },
    ],
    fit: [
      "Your site already brings enquiries from search and you can’t afford to lose them",
      "The site looks dated or is awkward on a phone, but the structure mostly works",
      "Your brand identity changed and the site has to follow",
    ],
    notFit: [
      { text: "You don’t yet know what is wrong — few enquiries, slow pages, falling traffic. Start with an audit.", alt: "website-audit" },
      { text: "Everything has changed — services, structure, audience. Building a new corporate website is simpler.", alt: "corporate-website" },
    ],
    faq: [
      { q: "How much does a redesign cost?", a: "From $890 for a typical scope. The number of pages, templates and integrations to migrate decides the final price." },
      { q: "How long does it take?", a: "From 3 weeks, depending on the size of the site and how quickly decisions are made." },
      { q: "Can you guarantee search positions won’t drop?", a: "Nobody can honestly guarantee rankings. What a careful migration does is remove the usual causes of a drop: lost addresses, missing redirects and broken markup." },
      { q: "Will the site stay online during the redesign?", a: "Yes. The new version is built on a separate test address; the switch happens only when it is ready." },
      OWNERSHIP,
    ],
    seeAlso: ["website-audit", "seo", "ui-ux-design", "corporate-website"],
  },
  {
    slug: "corporate-website",
    direction: "development",
    primary: "corporate-website",
    priceIds: ["corporate-website", "business-website", "ui-ux-design"],
    meta: {
      title: "Business and corporate website development — from $1,190",
      description: "Business websites from $1,190 and corporate websites from $1,990: a page for every service, an admin panel for your team, forms, analytics and up to three languages.",
    },
    label: "Corporate website",
    title: "Business and corporate websites that explain what you do in a minute.",
    lead: "A visitor understands what you offer, what it costs and how to reach you. Each service gets its own page that people can find in search, and your team updates news, vacancies and prices without calling a developer.",
    included: [
      "Site structure and a page map for your services",
      "Custom design — not a builder template",
      "Layouts for phone and desktop",
      "Admin panel for services, news, vacancies and contacts",
      "Enquiry forms delivered to email, Telegram or CRM",
      "Basic SEO, analytics and goals from launch",
      "Up to three languages: English, Russian, Armenian",
      "Publishing on hosting and handover of access",
    ],
    benefits: [
      { title: "Every service can be found", body: "A separate page per service, with its own title, description and answers — so the site is found for what people search, not only your name." },
      { title: "Your team edits it", body: "Changing a price or posting news takes minutes in the admin panel, without waiting for a developer." },
      { title: "A company people trust", body: "Custom design, real details and clear contacts. A partner checking you out before signing sees a real business." },
    ],
    process: [
      { title: "Brief and structure", duration: "3–5 days", body: "Your services, customers and competitors in search. Result: a page map and what each page says." },
      { title: "Design", duration: "1–1.5 weeks", body: "Home and key pages for phone and desktop, agreed before development starts." },
      { title: "Build", duration: "1.5–2 weeks", body: "Development, admin panel, forms and translations, shown as they come together." },
      { title: "Content and launch", duration: "3–5 days", body: "Content is moved in, analytics and SEO set up, the site published and your team shown the admin panel." },
    ],
    fit: [
      "You have several services or lines of business, each needing its own page",
      "Clients and partners check your website before they call or sign",
      "You publish news, vacancies or projects regularly",
    ],
    notFit: [
      { text: "One offer and an ad campaign for it — a landing page is quicker and cheaper.", alt: "landing-page" },
      { text: "You sell products with a cart and online payment — that is an online store.", alt: "online-store" },
    ],
    faq: [
      { q: "How much does a business or corporate website cost?", a: "A business website of up to five pages starts from $1,190. A corporate website with a service catalogue, news, careers and an admin panel starts from $1,990." },
      { q: "How long does it take?", a: "From 2 weeks for a business website and from 4 weeks for a corporate one, depending on the number of pages and how ready the content is." },
      { q: "What is the difference between the two?", a: "A business website covers the essentials on up to five pages. A corporate website adds a page per service, news, careers and an admin panel for your team." },
      { q: "What happens after launch?", a: "You can edit content yourself in the admin panel. Updates, backups and small changes can be handled through the website maintenance service." },
      OWNERSHIP,
    ],
    seeAlso: ["landing-page", "ui-ux-design", "seo", "website-maintenance"],
  },
  {
    slug: "online-store",
    direction: "development",
    primary: "online-store",
    priceIds: ["online-store", "integrations-payments", "seo"],
    meta: {
      title: "Online store development with payments and delivery — from $4,900",
      description: "Catalogue, cart, card and wallet payments, delivery zones, customer accounts and an admin panel with Telegram alerts. From $4,900, from 6 weeks.",
    },
    label: "Online store",
    title: "An online store with payments and delivery, built around how you sell.",
    lead: "Catalogue, cart and payment by card or local wallets — on your domain and under your own merchant agreement. Orders arrive in the admin panel and in Telegram, and prices and stock can sync with 1C or your warehouse system.",
    included: [
      "Catalogue with categories, filters and search",
      "Product pages with photos, variants and prices",
      "Cart and checkout in a few steps",
      "Card payments (ArCa, Visa, Mastercard) and wallets such as Idram and Telcell",
      "Delivery zones, rates and pickup",
      "Customer accounts and order history",
      "Admin panel for products, orders and statuses, with Telegram alerts",
      "Basic SEO, sales analytics and up to three languages",
    ],
    benefits: [
      { title: "Payment methods buyers already use", body: "Cards through your bank’s payment page plus local wallets. The money goes straight to your account; ONYQ is not in the payment chain." },
      { title: "Every order in one place", body: "Orders with payment and delivery status live in the admin panel, and a notification arrives in Telegram — no more cross-checking chats." },
      { title: "A catalogue search engines can read", body: "Every category and product has its own page with a title, description and markup, so search sees the whole range." },
    ],
    process: [
      { title: "Brief and catalogue", duration: "1 week", body: "Your range, delivery and payment methods. You apply to the bank or payment provider in parallel, so approval doesn’t hold up the work." },
      { title: "Design", duration: "1.5–2 weeks", body: "Home, catalogue, product page, cart, checkout and account — for phone and desktop." },
      { title: "Build and integrations", duration: "2–3 weeks", body: "Catalogue, admin panel, payments, delivery and, if needed, a connection to 1C or your warehouse." },
      { title: "Testing and launch", duration: "1 week", body: "Test orders, payments and refunds, catalogue filling, switching payments to live mode and handover." },
    ],
    fit: [
      "You have more products than fit in stories, and orders get lost in chats",
      "You want payment on the site instead of transfers to a personal card",
      "You need your own logic: regional delivery, wholesale prices, a 1C link",
    ],
    notFit: [
      { text: "One to three products with ads behind them — a landing page with an order form is enough.", alt: "landing-page" },
      { text: "You only need to add payments to an existing site.", alt: "integrations-payments" },
    ],
    faq: [
      { q: "How much does an online store cost?", a: "From $4,900 for a typical scope. Catalogue size, integrations (1C, warehouse, CRM) and delivery logic decide the final price." },
      { q: "How long does it take to launch?", a: "From 6 weeks. Bank or payment-provider approval runs in parallel and depends on them." },
      { q: "Which payment methods can be connected?", a: "ArCa, Visa and Mastercard cards through a bank payment page, and wallets such as Idram and Telcell. Apple Pay and Google Pay depend on what your bank supports." },
      { q: "Who signs the agreement with the bank?", a: "Your company does. ONYQ prepares the technical side and the pages banks usually check, such as terms, refunds and contacts." },
      OWNERSHIP,
    ],
    seeAlso: ["integrations-payments", "corporate-website", "seo", "website-maintenance"],
  },
  {
    slug: "integrations-payments",
    direction: "development",
    primary: "integrations-payments",
    priceIds: ["integrations-payments", "online-store", "crm-internal-systems"],
    meta: {
      title: "Payment integration: cards, Idram, Telcell, CRM and 1C — from $290",
      description: "Card and wallet payments on your site, server-side payment confirmation, refunds and notifications, plus CRM, 1C and accounting integrations. From $290.",
    },
    label: "Integrations & payments",
    title: "Payments and integrations that connect your site to the rest of the business.",
    lead: "Customers pay the way they are used to, the money lands in your account and the order marks itself as paid. You sign with the bank; ONYQ handles the technical side, tests payments and refunds, and only then switches to live mode.",
    included: [
      "Help with the technical paperwork for the bank or provider",
      "Pages banks usually check: terms, refunds, contacts",
      "ArCa, Visa and Mastercard cards via a bank payment page",
      "Idram and Telcell wallets",
      "Apple Pay and Google Pay where your bank supports them",
      "Server-side payment confirmation",
      "Refunds, cancellations and payment notifications",
      "CRM, 1C and accounting connections",
    ],
    benefits: [
      { title: "Money goes to your account", body: "The merchant agreement is in your company’s name and buyers enter card details on the bank’s own page." },
      { title: "Status without manual checks", body: "Payment is confirmed by the bank’s server, not the buyer’s browser, so an order can’t be marked paid unless the money arrived." },
      { title: "Refunds and alerts", body: "Cancel and refund from the admin panel where the method supports it; you and the buyer are notified of every payment." },
    ],
    process: [
      { title: "Choice and paperwork", duration: "1–2 days", body: "Which methods you need. You apply; the technical part and required pages are prepared. Approval time depends on the bank." },
      { title: "Integration", duration: "2–4 days", body: "Payments connected in test mode: payment, confirmation, order statuses." },
      { title: "Test payments", duration: "1–2 days", body: "Successful payment, decline, cancellation and refund, with notifications checked on both sides." },
      { title: "Going live", duration: "1 day", body: "Test keys are swapped for live ones and a small real payment is made and refunded." },
    ],
    fit: [
      "You have a site but take payment by transfer or cash on delivery",
      "You want to add wallets to existing card payments",
      "Your site, CRM and accounting don’t talk to each other",
    ],
    notFit: [
      { text: "You need a catalogue, cart and delivery as well — that is an online store.", alt: "online-store" },
      { text: "Your customers order in Telegram — payment can happen inside the bot.", alt: "telegram-bot" },
    ],
    faq: [
      { q: "How much does payment integration cost?", a: "From $290 for one payment method on an existing site. Each additional method or system (CRM, 1C, accounting) adds its own data exchange and testing." },
      { q: "How long does it take?", a: "From 5 days of work. Bank approval runs separately and depends on the bank." },
      { q: "Who signs the agreement with the bank?", a: "Your company. The integration is set up under your merchant account." },
      OWNERSHIP,
    ],
    seeAlso: ["online-store", "telegram-bot", "crm-internal-systems", "website-maintenance"],
  },
  {
    slug: "website-maintenance",
    direction: "development",
    primary: "website-maintenance",
    priceIds: ["website-maintenance", "website-audit", "website-redesign"],
    meta: {
      title: "Website maintenance and support — from $99/month",
      description: "Monthly updates, off-site backups, uptime monitoring, domain and certificate tracking, security patches and small edits. From $99 per month.",
    },
    label: "Website maintenance",
    title: "Website maintenance, so the site simply keeps working.",
    lead: "Every month the site is updated, backed up and watched, and small edits are made on request. At the end of the month you get a short report of what was done and how much of the agreed scope remains.",
    included: [
      "Updates to the platform, libraries and plugins",
      "Daily backups stored away from the server",
      "Uptime and response-time monitoring",
      "Domain and SSL certificate expiry tracking",
      "Patches for known vulnerabilities",
      "Small edits within the agreed scope",
      "A monthly report on the work done",
      "Support for sites built by others, after an audit",
    ],
    benefits: [
      { title: "Outages are noticed early", body: "Monitoring checks the site constantly, and an alert goes out as soon as it stops responding." },
      { title: "Backups that restore", body: "Backups live separately from the site, and restoring from them is tested — not assumed." },
      { title: "Edits without a hunt", body: "A price, phone number or banner changes with one message instead of a search for whoever built the site." },
    ],
    process: [
      { title: "Inventory and access", duration: "2–3 days", body: "Where the site is hosted, whose name the domain is in, where backups go. Sites built elsewhere start with an audit." },
      { title: "Monitoring", duration: "1 day", body: "Uptime, certificate and domain monitoring, backups configured and a first restore tested." },
      { title: "Maintenance", duration: "every month", body: "Updates, patches, backup checks and your small edits within the agreed scope." },
      { title: "Report", duration: "end of month", body: "What was done and what remains. Anything beyond scope is estimated first and started only with your approval." },
    ],
    fit: [
      "Your site brings enquiries or sales, so downtime costs money",
      "You have no developer in-house but need edits a few times a month",
      "The site was built long ago or by another studio and nobody knows where things are",
    ],
    notFit: [
      { text: "The site is so outdated that maintaining it costs more than rebuilding — consider a redesign.", alt: "website-redesign" },
      { text: "The site works but brings few enquiries — start with an audit.", alt: "website-audit" },
    ],
    faq: [
      { q: "How much does maintenance cost?", a: "From $99 per month for a typical site. The size of the site and the volume of edits you expect decide the plan." },
      { q: "How fast is a problem handled?", a: "Response times are agreed in the maintenance terms for your plan." },
      { q: "Do you maintain sites built by someone else?", a: "Yes, after an audit that shows what the site runs on and what needs fixing first." },
    ],
    seeAlso: ["website-audit", "website-redesign", "seo", "corporate-website"],
  },
  {
    slug: "branding",
    direction: "design",
    primary: "logo",
    priceIds: ["logo", "brand-identity"],
    meta: {
      title: "Logo and brand identity design — from $390",
      description: "A logo from $390 or a full brand identity with a brand book from $1,490: three concepts, refinement, palette, typography, collateral and source files.",
    },
    label: "Logo & brand identity",
    title: "A logo and identity that work from business card to shopfront.",
    lead: "A logo is a mark. An identity is the set of rules that lets the mark, colours and type work on your site, packaging, signage and social media. The work starts with the business, then the drawing — and ends with files any designer can use.",
    included: [
      "Brief and a review of competitors in your niche",
      "Three logo concepts to choose from",
      "Refinement of the chosen concept",
      "Colour palette and brand typefaces",
      "Collateral: business card, letterhead, social, packaging",
      "Brand book with usage rules",
      "Source files in AI, SVG and PDF, plus PNG",
      "Usage guidance for print, screen and signage",
    ],
    benefits: [
      { title: "One recognisable look", body: "Site, packaging, card and posts look like one company, not the work of three designers." },
      { title: "Rules instead of debates", body: "The brand book says which colour, typeface and spacing to use, so a new designer or printer doesn’t have to guess." },
      { title: "Files for every use", body: "Vector and raster, colour and one-colour, for print and screen — nothing needs redrawing for a sign." },
    ],
    process: [
      { title: "Brief and research", duration: "2–3 days", body: "Who your customers are, what competitors look like and what the brand should say." },
      { title: "Concepts", duration: "3–5 days", body: "Three distinct directions, shown on real items — a sign, packaging, a profile picture." },
      { title: "Refinement", duration: "2–4 days", body: "Proportions, colour and small-size versions of the chosen mark. A logo-only order ends here." },
      { title: "Identity and brand book", duration: "1–2 weeks", body: "Palette, typefaces, collateral and rules in one document, with all source files." },
    ],
    fit: [
      "You are launching a company, shop or product from scratch",
      "You have a logo, but it looks different everywhere it appears",
      "You are preparing packaging, signage or a website and need rules to build them by",
    ],
    notFit: [
      { text: "Your brand exists and you need a website or app interface — that is UX/UI design.", alt: "ui-ux-design" },
      { text: "Your identity is ready and you need a page that sells — start with a landing page.", alt: "landing-page" },
    ],
    faq: [
      { q: "How much do a logo and identity cost?", a: "A logo starts from $390. A full identity with a brand book starts from $1,490." },
      { q: "How long does it take?", a: "From 7 days for a logo and from 3 weeks for an identity with a brand book." },
      { q: "What is the difference between a logo and an identity?", a: "The logo is the mark itself. The identity adds colour, type, collateral and the rules that keep everything consistent." },
      { q: "Who owns the logo?", a: "Rights to the mark transfer to you once the work is paid for." },
    ],
    seeAlso: ["ui-ux-design", "landing-page", "smm", "corporate-website"],
  },
  {
    slug: "ux-ui-design",
    direction: "design",
    primary: "ui-ux-design",
    priceIds: ["ui-ux-design", "ux-audit"],
    meta: {
      title: "UX/UI design for websites and apps — from $490",
      description: "Structure, clickable prototype and phone and desktop layouts with every state, from $490. UX audit with a prioritised fix list from $290.",
    },
    label: "UX/UI design",
    title: "Web and app design that is clear to users and to developers.",
    lead: "First decide what a person needs to find and do, then draw it. Structure, a clickable prototype and phone and desktop layouts with every state — so nobody has to guess during development.",
    included: [
      "Review of user tasks and competitors",
      "Sitemap and flows for key actions",
      "Clickable prototype in Figma",
      "Layouts for phone and desktop",
      "States: errors, loading, empty screens",
      "Component and style library",
      "Layouts checked in English, Russian and Armenian",
      "Developer handover and answers to their questions",
    ],
    benefits: [
      { title: "A clear path to the goal", body: "People see where they are and what to do next; buttons and forms sit where people look for them." },
      { title: "Tested before code", body: "Click through the prototype with your team or customers and fix logic while it is still cheap." },
      { title: "Layouts that get built as drawn", body: "Components, states and spacing are documented, so the finished product matches the approved design." },
    ],
    process: [
      { title: "Research and structure", duration: "2–3 days", body: "Who comes and why, competitors and current analytics. Result: a sitemap and user flows." },
      { title: "Prototype", duration: "2–3 days", body: "A black-and-white clickable wireframe. Logic is approved before visual design." },
      { title: "Visual design", duration: "4–6 days", body: "Phone and desktop design with every state — errors, empty lists, loading, disabled buttons." },
      { title: "Handover", duration: "1–2 days", body: "Components and styles organised, spacing and behaviour documented, developer questions answered." },
    ],
    fit: [
      "You want to approve a site or app before development",
      "You have developers who need clear layouts",
      "You are launching a portal, service or new section and need its screen logic",
    ],
    notFit: [
      { text: "There is no logo or identity yet — start there, or the interface will need repainting.", alt: "brand-identity" },
      { text: "Your site is live but you don’t know why it underperforms — start with an audit.", alt: "website-audit" },
    ],
    faq: [
      { q: "How much does UX/UI design cost?", a: "Website UI/UX design starts from $490. A UX audit with a prioritised list of fixes starts from $290." },
      { q: "How long does it take?", a: "From 10 days for design and from 5 days for an audit." },
      { q: "What is the difference between UX and UI?", a: "UX is the structure and logic: what is where and how people get to their goal. UI is how it looks: type, colour, components and states." },
      { q: "What does a UX audit include?", a: "A walk through the main user journeys on phone and desktop, where people get stuck, and a list of fixes ranked by impact." },
    ],
    seeAlso: ["brand-identity", "landing-page", "website-audit", "corporate-website"],
  },
  {
    slug: "telegram-bot",
    direction: "mobile-apps",
    primary: "telegram-bot",
    priceIds: ["telegram-bot", "integrations-payments", "ai-assistant"],
    meta: {
      title: "Telegram bot and mini app development — from $590",
      description: "Bots and Telegram Mini Apps for requests, bookings, catalogues and payments, connected to your CRM and team chat. From $590, from 10 days.",
    },
    label: "Telegram bot",
    title: "Telegram bots and mini apps, right where your customers already are.",
    lead: "A bot that takes requests, books appointments, shows a catalogue and accepts payment — with nothing to install. When buttons aren’t enough, a Telegram Mini App adds a full interface with a cart and account inside Telegram.",
    included: [
      "Conversation flow and menu structure",
      "Requests, bookings and a product catalogue",
      "A Mini App when you need a full interface",
      "Payments through your connected provider",
      "Notifications to customers and the team chat",
      "Sync with your CRM, spreadsheets or admin panel",
      "Up to three languages: English, Russian, Armenian",
      "Server launch and handover of code and access",
    ],
    benefits: [
      { title: "Requests at any hour", body: "The bot replies instantly, collects the details and passes them to a manager — evenings and weekends included." },
      { title: "Nothing to download", body: "Customers already have Telegram; a Mini App opens straight from the chat." },
      { title: "Everything lands in your system", body: "Requests, bookings and orders go to your CRM, spreadsheet or admin panel, with a notification in the team chat." },
    ],
    process: [
      { title: "Flow", duration: "1–2 days", body: "Step by step: what the customer does and where each request goes. You approve the flow first." },
      { title: "Interface", duration: "2–3 days", body: "Buttons and messages in the languages you need; screen layouts for a Mini App." },
      { title: "Development", duration: "5–8 days", body: "The bot, payments, CRM and notifications, with a working version to try along the way." },
      { title: "Launch", duration: "1–2 days", body: "Launch on the server, every flow tested on real phones, access handed over." },
    ],
    fit: [
      "Customers already message you on Telegram and requests get lost",
      "You need bookings, orders or a catalogue without a separate app",
      "You want to keep customers updated about orders or appointments",
    ],
    notFit: [
      { text: "The bot must answer open questions from your documents — you need an AI assistant.", alt: "ai-assistant" },
      { text: "You need a full app in the App Store and Google Play — that is mobile development.", alt: "mobile-app" },
    ],
    faq: [
      { q: "How much does a Telegram bot cost?", a: "From $590 for a typical bot. Payments, integrations and a Mini App interface add to the scope." },
      { q: "How long does it take?", a: "From 10 days for a typical bot." },
      { q: "How is a Mini App different from a regular bot?", a: "A regular bot works through messages and buttons. A Mini App opens a full web interface inside Telegram — a catalogue, cart or account." },
      OWNERSHIP,
    ],
    seeAlso: ["ai-assistant", "integrations-payments", "mobile-app", "crm-internal-systems"],
  },
  {
    slug: "ai-assistant",
    direction: "ai",
    primary: "ai-assistant",
    priceIds: ["ai-assistant", "ai-automation", "telegram-bot"],
    meta: {
      title: "AI assistant for your website and AI automation — from $990",
      description: "An AI assistant that answers only from your approved knowledge base and hands over to a manager, from $990. AI integration and automation from $1,990.",
    },
    label: "AI assistant",
    title: "An AI assistant that answers from your knowledge — and says so when it can’t.",
    lead: "The assistant answers visitors only from topics you approve: terms, prices, delivery, how to order. If the answer isn’t there, it says so and calls a person. It can run on your own server, so conversations and contacts stay with you.",
    included: [
      "A knowledge base built from your materials and chats",
      "Question-and-answer topics you approve",
      "A model chosen for the task and budget",
      "A website widget in your brand colours",
      "Handover to a manager in the same window",
      "Contacts from chats sent to email, Telegram or CRM",
      "Testing on your customers’ real questions",
      "Installation on your own server if needed",
    ],
    benefits: [
      { title: "No invented answers", body: "No approved topic, no improvising: the assistant says it doesn’t know and hands the chat to a person." },
      { title: "Managers on what matters", body: "Repeat questions — delivery, payment, opening hours — are handled; people step in for orders, disputes and unusual requests." },
      { title: "Contacts don’t get lost", body: "A phone number left in chat becomes a lead with a status instead of sinking in message history." },
    ],
    process: [
      { title: "Knowledge base", duration: "3–5 days", body: "Answers gathered from your site, price list, terms and chats. You approve every topic." },
      { title: "Setup", duration: "2–4 days", body: "Model, greeting, tone and handover rules; the widget is added to your site." },
      { title: "Testing", duration: "3–4 days", body: "Real customer questions, awkward ones included. Weak answers are fixed in the base, not left to chance." },
      { title: "Launch", duration: "1–2 days", body: "Opened to visitors, notifications connected, managers shown how to take over a chat." },
    ],
    fit: [
      "Your team answers the same questions every day",
      "Visitors write in the evenings and at weekends",
      "It matters that the bot never promises what isn’t in your terms",
    ],
    notFit: [
      { text: "Your flow is fixed — bookings, orders, step-by-step requests. A Telegram bot will do without AI.", alt: "telegram-bot" },
      { text: "You need AI to process documents, mail or leads inside your systems — that is AI automation.", alt: "ai-automation" },
    ],
    faq: [
      { q: "How much does an AI assistant cost?", a: "An AI assistant for your website starts from $990. AI integration and automation inside your systems starts from $1,990. Model usage fees are billed by the provider and are separate." },
      { q: "How long does it take to launch?", a: "From 2 weeks for a website assistant and from 4 weeks for automation projects." },
      { q: "What if the assistant gives a wrong answer?", a: "Answers come only from approved topics, and every launch includes testing on real questions. If something is off, the topic in the base is corrected." },
      { q: "Where are conversations stored?", a: "Depending on the setup, either with the chosen provider or on your own server. This is agreed before launch." },
    ],
    seeAlso: ["telegram-bot", "business-analytics", "crm-internal-systems", "website-maintenance"],
  },
  {
    slug: "seo",
    direction: "marketing",
    primary: "seo",
    priceIds: ["seo", "ai-search-visibility", "website-audit"],
    meta: {
      title: "SEO and AI search visibility — from $350/month",
      description: "Monthly SEO in English, Russian and Armenian: technical fixes, structure, content and links, with monthly reports. AI search visibility from $590/month.",
    },
    label: "SEO",
    title: "SEO so customers find you without paying for every click.",
    lead: "Monthly work that gets your site bringing in customers from search on its own. The technical side is fixed, pages are built around real queries in Armenian, Russian and English, and you see what changed every month. First movement usually shows after a few months.",
    included: [
      "Audit of your site and search competitors",
      "Keyword research in Armenian, Russian and English",
      "Speed, indexing and technical errors",
      "Structure, titles and page markup",
      "Copy for new and existing pages",
      "Links and mentions on relevant sites",
      "Search Console, Yandex Webmaster and analytics",
      "Monthly report: positions, traffic, enquiries",
    ],
    benefits: [
      { title: "Traffic without per-click costs", body: "Visitors from search don’t cost anything per visit, and a page that ranks keeps working long after it was written." },
      { title: "Three search languages", body: "People search for the same service in Armenian, Russian and English. Queries are collected in each language, not machine-translated." },
      { title: "Reports in enquiries", body: "Each month: what was done, which queries grew, how many people came from search and how many got in touch." },
    ],
    process: [
      { title: "Audit and strategy", duration: "month 1", body: "Site check, queries in three languages, who ranks today. Result: a month-by-month plan." },
      { title: "Technical fixes", duration: "months 1–2", body: "Speed, indexing errors, duplicates, the mobile version — fixed by ONYQ or handed to your developer." },
      { title: "Content and structure", duration: "monthly", body: "Pages for real queries: services, areas, customer questions. One page, one query, one clear answer." },
      { title: "Links and reporting", duration: "monthly", body: "Relevant links and mentions; a report and next month’s plan." },
    ],
    fit: [
      "Customers search for what you do on Google",
      "You can invest a few months in a steady flow from search",
      "Ads keep getting more expensive and you want to depend on them less",
    ],
    notFit: [
      { text: "You need enquiries this week — SEO isn’t that fast; start with search ads.", alt: "search-ads" },
      { text: "The site is slow, not indexed or its forms fail — start with an audit.", alt: "website-audit" },
    ],
    faq: [
      { q: "How much does SEO cost?", a: "From $350 per month. AI search visibility — helping assistants such as ChatGPT, Gemini and Perplexity find and cite your company — starts from $590 per month." },
      { q: "When will I see results?", a: "First movement usually appears after two to four months. It depends on competition, the site’s history and how quickly fixes are made." },
      { q: "Do you guarantee top-10 positions?", a: "No honest provider can guarantee positions, because search engines decide them. What can be committed to is the work, the plan and transparent reporting." },
      { q: "What is AI search visibility?", a: "Work on your site and mentions so AI assistants can find accurate information about your company and cite it when people ask about your field." },
    ],
    seeAlso: ["website-audit", "search-ads", "landing-page", "corporate-website"],
  },
  {
    slug: "search-ads",
    direction: "marketing",
    primary: "search-ads",
    priceIds: ["search-ads", "landing-page", "smm"],
    meta: {
      title: "Google Ads and Yandex Direct management — from $390/month",
      description: "Search and display campaigns in Google Ads and Yandex Direct: setup, weekly optimisation, lead tracking and reporting. From $390/month; ad budget paid separately.",
    },
    label: "Search & display ads",
    title: "Search ads for people who are already looking for you.",
    lead: "Your ads reach people searching for your service on Google or Yandex right now. Queries are collected, campaigns and lead tracking set up, and whatever wastes money is cut every week. The ad budget is paid directly to the ad platforms and is not part of the management fee.",
    included: [
      "Audit of existing campaigns, if any",
      "Keywords and negatives in three languages",
      "Campaigns in Google Ads and Yandex Direct",
      "Ad copy and extensions",
      "Lead tracking: forms, calls, messengers",
      "Linked to Google Analytics and Yandex Metrica",
      "Weekly query clean-up and bid changes",
      "Monthly report: spend, enquiries, cost per enquiry",
    ],
    benefits: [
      { title: "Live from the first day", body: "Ads show as soon as they are approved — useful for a new business, an offer or a season." },
      { title: "Budget under control", body: "Negative keywords, schedules, locations and bids keep money off random clicks; the budget stays in your account." },
      { title: "Cost per enquiry in plain sight", body: "Forms, calls and messages are tracked, so you see what each enquiry cost and which campaign brought it." },
    ],
    process: [
      { title: "Audit and keywords", duration: "3–5 days", body: "Site, competitors and past campaigns; the queries to target and the ones to exclude." },
      { title: "Campaigns and tracking", duration: "3–5 days", body: "Campaigns, ads and conversion tracking, in an ad account registered to your company." },
      { title: "Launch", duration: "week 1", body: "Ads go live after platform approval; spend is checked daily in the first week." },
      { title: "Weekly optimisation", duration: "weekly", body: "Query clean-up, bids and ad tests each week; a report and plan each month." },
    ],
    fit: [
      "People already search for your service on Google",
      "You need enquiries now, not in a few months",
      "You have an ad budget and want to see the cost of each enquiry",
    ],
    notFit: [
      { text: "You want a long-term flow from search without paying per click — that is SEO.", alt: "seo" },
      { text: "There is no page to send ad traffic to — start with a landing page.", alt: "landing-page" },
    ],
    faq: [
      { q: "How much does ads management cost?", a: "From $390 per month for management. The advertising budget itself is paid directly to Google and Yandex and is separate." },
      { q: "How soon do the ads go live?", a: "Usually within the first week, once the platforms approve the ads." },
      { q: "What ad budget do I need?", a: "It depends on competition and the cost of a click in your field. A starting budget is suggested after the keyword research." },
    ],
    seeAlso: ["seo", "landing-page", "smm", "website-audit"],
  },
  {
    slug: "smm",
    direction: "marketing",
    primary: "smm",
    priceIds: ["smm", "search-ads", "brand-identity"],
    meta: {
      title: "SMM and paid social: Instagram, Facebook, Telegram — from $450/month",
      description: "Content plans, posts and stories in your style, account management and paid social with lead tracking. From $450/month; ad budget paid separately to Meta.",
    },
    label: "SMM & paid social",
    title: "Social media and paid social, reported in enquiries rather than likes.",
    lead: "Instagram and Facebook are where many customers choose, and Telegram is where channels live. Accounts run to a content plan, paid social reaches the right people, and the report counts messages and enquiries. The ad budget is paid separately to Meta.",
    included: [
      "Review of your account, audience and competitors",
      "A content plan a month ahead",
      "Post copy in the languages you need",
      "Post and story design in your style",
      "Instagram, Facebook and Telegram channel management",
      "Paid ads on Instagram and Facebook",
      "Meta pixel and website lead tracking",
      "Monthly report: enquiries, cost, conclusions",
    ],
    benefits: [
      { title: "An account that runs to plan", body: "Posts and stories go out on a plan you approved a month ahead — no daily guessing." },
      { title: "Ads for the right people", body: "Targeting by city, interests and behaviour, with creatives tested and the ones that bring enquiries kept." },
      { title: "Enquiries are what count", body: "The report shows messages, leads and calls from ads and their cost; reach is there, but it isn’t the point." },
    ],
    process: [
      { title: "Audit and strategy", duration: "week 1", body: "Account, competitors and audience; which networks matter and what ads should achieve." },
      { title: "Plan and visuals", duration: "week 2", body: "A month of posts and templates in your brand style. You approve before anything is published." },
      { title: "Posting and ads", duration: "monthly", body: "Posting to plan, launching ads and testing creatives." },
      { title: "Report and adjust", duration: "monthly", body: "Enquiries and cost per enquiry, with next month’s plan." },
    ],
    fit: [
      "Your customers choose on Instagram: cafés, salons, shops, services",
      "You have an account but no time for it",
      "You want social ads with a clear cost per enquiry",
    ],
    notFit: [
      { text: "Demand exists and people search for you — search ads will work faster.", alt: "search-ads" },
      { text: "You don’t have a recognisable visual style yet — start with a logo and identity.", alt: "brand-identity" },
    ],
    faq: [
      { q: "How much does SMM cost?", a: "From $450 per month for management. The advertising budget is paid separately to Meta." },
      { q: "Which networks do you cover?", a: "Instagram and Facebook for content and ads, and Telegram channels for content." },
      { q: "Do I approve posts before they go out?", a: "Yes. The month’s plan and visuals are approved before publishing." },
    ],
    seeAlso: ["search-ads", "brand-identity", "landing-page", "seo"],
  },
  {
    slug: "website-audit",
    direction: "marketing",
    primary: "website-audit",
    priceIds: ["website-audit", "ux-audit", "seo"],
    meta: {
      title: "Website audit: speed, SEO, errors and conversion — from $250",
      description: "A hand-checked website audit covering speed, indexing, technical errors, mobile, forms and basic security, with a prioritised fix plan and estimates. From $250.",
    },
    label: "Website audit",
    title: "A website audit with a plan of what to fix first.",
    lead: "Why the site is slow, hard to find or not bringing enquiries. Speed, indexing, the mobile version, forms and basic security are checked, and you get a report: what’s broken, how much it matters and what fixing it involves.",
    included: [
      "Load speed and Core Web Vitals",
      "Indexing in Google and Yandex",
      "Technical errors: broken links, redirects, duplicates",
      "Page titles, descriptions and markup",
      "Mobile version on real phones",
      "Forms, analytics and the path to an enquiry",
      "Basic security: HTTPS, updates, access",
      "Report with prioritised fixes and estimates",
    ],
    benefits: [
      { title: "A clear list of problems", body: "Not a hundred lines from an automated checker, but hand-verified issues with an explanation of how each one hurts." },
      { title: "Priorities and estimates", body: "Every fix is ranked by importance with an effort estimate, so you know what to do first." },
      { title: "Your call", body: "Order the fixes from ONYQ, hand them to your developer or do them yourself — the report is written for any developer." },
    ],
    process: [
      { title: "Access and goals", duration: "1 day", body: "What worries you, plus access to Search Console and analytics if you have them." },
      { title: "Technical check", duration: "2–3 days", body: "Speed, indexing, errors and security — scanners plus a manual check of every finding." },
      { title: "Mobile and conversion", duration: "1–2 days", body: "The customer journey on phone and desktop; every form submitted and checked in analytics." },
      { title: "Report and walkthrough", duration: "1 day", body: "The report with priorities and estimates, walked through item by item on a call." },
    ],
    fit: [
      "The site got slow or dropped in search and you don’t know why",
      "You get visitors but few enquiries",
      "You want to be sure the site is ready before investing in ads or SEO",
    ],
    notFit: [
      { text: "You’ve already decided to replace the site — go straight to a redesign.", alt: "website-redesign" },
      { text: "You need ongoing search work rather than a one-off check — that is SEO.", alt: "seo" },
    ],
    faq: [
      { q: "How much does an audit cost?", a: "A website audit starts from $250. A UX audit focused on user journeys starts from $290." },
      { q: "How long does it take?", a: "From 5 days, including the walkthrough call." },
      { q: "Will you fix the problems too?", a: "If you want. The fixes can be ordered separately, or the report can go to your own developer." },
    ],
    seeAlso: ["seo", "website-redesign", "ui-ux-design", "website-maintenance"],
  },
];

export function getServicePage(slug: string): ServicePage | undefined {
  return servicePages.find((p) => p.slug === slug);
}
