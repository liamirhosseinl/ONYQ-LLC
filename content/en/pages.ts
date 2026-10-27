import type { FaqItem } from "./service-pages.ts";
import type { ServiceId } from "../../data/services.ts";

export const faqPage = {
  meta: {
    title: "FAQ: prices, timelines and how projects work",
    description: "Answers to common questions about ONYQ services: starting prices, timelines, what each service includes and how a project runs.",
  },
  title: ["Questions", "and answers."] as [string, string],
  lead: "What people ask before the first conversation: what things cost, how long they take and what each service includes.",
  general: {
    title: "Working with ONYQ",
    items: [
      {
        q: "How does a project start?",
        a: "With a short brief: what you want to build, what exists today and how to reach you. ONYQ replies with clarifying questions or a first view of scope and timing.",
      },
      {
        q: "How is progress shared?",
        a: "On a working version: you click through what has been built rather than reading status messages.",
      },
      {
        q: "In which languages can my site be built?",
        a: "English, Russian and Armenian — one, two or all three, depending on your audience.",
      },
    ] satisfies FaqItem[],
  },
};

export const contactsPage = {
  meta: {
    title: "Contact ONYQ — start a project brief",
    description: "Tell ONYQ what you are building: a short brief about the challenge, the starting point, the areas you need and how to reach you.",
  },
  title: ["Tell us what", "you’re building."] as [string, string],
  lead: "Answer a few short questions. The more ONYQ knows about the goal and what exists today, the more useful the first reply.",
  channelsTitle: "Other ways to reach ONYQ",
  channelsPending:
    "Direct channels — email, Telegram, phone — will appear here once ONYQ confirms them. Until then, the brief above is the way to get in touch.",
};

export interface Concept {
  id: string;
  kind: "commerce" | "messaging" | "insight";
  meta: string;
  title: [string, string];
  problem: string;
  shows: string[];
  services: ServiceId[];
}

export const portfolioPage = {
  meta: {
    title: "Work — ONYQ case studies",
    description: "Brands, platforms and apps designed and built by ONYQ: Vihan School, Eagle VPN, an English-language institute platform — plus concept studies.",
  },
  title: ["Selected", "work."] as [string, string],
  lead: "Brands, platforms and mobile apps ONYQ has designed and built. Each case shows the challenge, what we did and what changed — with results only as the client reported them.",
  casesLabel: "Case studies",
  conceptsLabel: "Concept studies",
  conceptsTitle: ["How we would approach", "typical problems."] as [string, string],
  conceptsLead: "Alongside client work, these concepts show how ONYQ would tackle common problems — and which services they involve.",
  notice:
    "Every business in the concept studies is fictional. They are illustrations made for this site; they are not client projects and show no real results.",
  concepts: [
    {
      id: "ceramics-store",
      kind: "commerce",
      meta: "Concept · Online store",
      title: ["A shop that feels", "like the studio."],
      problem:
        "A small ceramics workshop sells through Instagram messages. Orders get lost in chats, prices are sent by hand and every delivery is arranged one by one.",
      shows: [
        "A catalogue with variants and stock",
        "Delivery zones with rates and pickup",
        "Card and wallet payments at checkout",
        "Orders in one admin panel, with Telegram alerts",
      ],
      services: ["online-store", "integrations-payments", "smm"],
    },
    {
      id: "booking-mini-app",
      kind: "messaging",
      meta: "Concept · Telegram mini app",
      title: ["Bookings without", "the back-and-forth."],
      problem:
        "A clinic books appointments by phone and messages. Staff spend hours confirming times, and patients forget their visits.",
      shows: [
        "Free slots shown inside Telegram",
        "Booking in a few taps, no app to install",
        "Reminders before the visit",
        "A notification to the team chat for every booking",
      ],
      services: ["telegram-bot", "crm-internal-systems", "ai-assistant"],
    },
    {
      id: "retail-dashboard",
      kind: "insight",
      meta: "Concept · Analytics dashboard",
      title: ["Sales, ads and stock", "on one screen."],
      problem:
        "A retailer collects numbers from the shop, ad accounts and the warehouse into spreadsheets every week — and still can’t say which channel brings orders.",
      shows: [
        "One dashboard that refreshes itself",
        "Orders and revenue by channel",
        "Stock alerts before items run out",
        "Unit economics per product",
      ],
      services: ["business-analytics", "financial-model", "search-ads"],
    },
  ] satisfies Concept[],
};
