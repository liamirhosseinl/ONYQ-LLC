/**
 * Case studies — real ONYQ projects supplied by the owner (portfolio/NN-name/info.txt,
 * 19 Oct 2026). Language-neutral facts live here; copy lives in content/<locale>/cases.ts.
 *
 * Rules carried over from info.txt:
 *  - `client` is published only when show_client = yes; otherwise the case says "under NDA".
 *  - `logo` artwork appears only when show_logo = yes (all three: yes).
 *  - Results are exactly what the owner reported; no testimonials were supplied, so none appear.
 *
 * Adding a project: drop its WebP images into public/work/<slug>/, add an entry below and its
 * copy to content/{en,ru,hy}/cases.ts. Images: 2000 px wide WebP (see docs/portfolio-intake.md).
 */
import type { ServiceId } from "./services.ts";

export interface CaseImage {
  src: string;
  width: number;
  height: number;
  /** Key into the locale's `alts` map for this case. */
  alt: string;
  /** Layout hint for the gallery. */
  span?: "full" | "half" | "tall" | "reel";
  /** Muted looping video shown in place of the still (the still is its poster). */
  video?: string;
  /** Dark mock-ups read better on a dark tile; light ones on a light tile. */
  tone?: "light" | "dark";
  /** A cut-out device render (transparent background) shown on the site's own stage. */
  cutout?: boolean;
}

export interface CaseStudy {
  slug: string;
  year: number;
  /** Published client name, or null when the client asked not to be named. */
  client: string | null;
  showLogo: boolean;
  url: string | null;
  /** Catalogue services this project used (links to the service pages). */
  services: ServiceId[];
  /** Directions the case belongs to (links to /design, /development …). */
  directions: ("design" | "development" | "mobile-apps" | "marketing" | "ai" | "content")[];
  /** Accent colour taken from the client's own identity, for the case page chrome. */
  accent: string;
  accentInk: string;
  /** The client's brand palette, when the work included identity. */
  palette?: { hex: string; key: "primary" | "accent" | "secondary" }[];
  metric?: { value: number; prefix?: string; suffix?: string };
  /**
   * "preview": designed and built, shown on a preview address while the client signs off —
   * not yet live on the client's own domain. The case says so plainly and shows no results.
   */
  status?: "live" | "preview";
  cover: CaseImage;
  /** Optional wide image for the homepage work row (defaults to the cover). */
  feature?: CaseImage;
  gallery: CaseImage[];
}

const img = (slug: string, n: string, width: number, height: number, alt: string, extra: Partial<CaseImage> = {}): CaseImage => ({
  src: `/work/${slug}/${n}.webp`,
  width,
  height,
  alt,
  ...extra,
});

/** A desktop screen of a site (2000 × 1250) or a phone screen (780 × 1688). */
const screen = (slug: string, n: string, alt: string, extra: Partial<CaseImage> = {}) => img(slug, n, 2000, 1250, alt, extra);
const phone = (slug: string, n: string, alt: string) => img(slug, n, 780, 1688, alt, { span: "reel" });

function reel(name: string, alt: string): CaseImage {
  return { ...img("amir-khaldari", name, 540, 960, alt, { span: "reel" }), video: `/work/amir-khaldari/${name}.mp4` };
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "amir-khaldari",
    year: 2026,
    client: "Amir Khaldari",
    showLogo: true,
    url: "https://www.amirkhaldari.me",
    services: ["landing-page", "ui-ux-design", "smm"],
    directions: ["design", "development", "content"],
    accent: "#E9B949",
    accentInk: "#15130C",
    metric: { value: 963, suffix: "+" },
    cover: screen("amir-khaldari", "site26-hero2", "siteHero", { tone: "dark" }),
    gallery: [
      screen("amir-khaldari", "site26-hook", "siteHook", { span: "full" }),
      phone("amir-khaldari", "site26-mobile-1", "siteMobile1"),
      reel("hormozi", "reelHormozi"),
      reel("critical-skill", "reelCritical"),
      phone("amir-khaldari", "site26-mobile-2", "siteMobile2"),
      screen("amir-khaldari", "site26-hold", "siteHold", { span: "half", tone: "light" }),
      screen("amir-khaldari", "site26-orbit", "siteOrbit", { span: "half", tone: "dark" }),
      screen("amir-khaldari", "site26-retention", "siteRetention", { span: "full", tone: "light" }),
      reel("discord-community", "reelDiscord"),
      phone("amir-khaldari", "site26-mobile-3", "siteMobile3"),
      reel("do-it", "reelDoIt"),
      phone("amir-khaldari", "site26-mobile-4", "siteMobile4"),
      screen("amir-khaldari", "site26-results", "siteResults", { span: "half", tone: "dark" }),
      screen("amir-khaldari", "site26-closing", "siteClosing", { span: "half", tone: "dark" }),
      reel("its-up-to-you", "reelUpToYou"),
      reel("most-impactful-thing", "reelImpact"),
      screen("amir-khaldari", "site26-contact", "siteContact", { span: "full", tone: "dark" }),
    ],
  },
  {
    slug: "familish",
    year: 2026,
    client: "Familish",
    showLogo: true,
    url: "https://familisham.netlify.app",
    status: "preview",
    services: ["business-website", "ui-ux-design", "crm-internal-systems"],
    directions: ["design", "development"],
    accent: "#2C6B57",
    accentInk: "#FFF6EA",
    cover: screen("familish", "hero", "hero", { tone: "light" }),
    gallery: [
      screen("familish", "promises", "promises", { span: "full", tone: "dark" }),
      phone("familish", "mobile-1", "mobile1"),
      phone("familish", "mobile-2", "mobile2"),
      phone("familish", "mobile-3", "mobile3"),
      phone("familish", "mobile-4", "mobile4"),
      screen("familish", "craving", "craving", { span: "half", tone: "light" }),
      screen("familish", "kitchen-tv", "kitchenTv", { span: "half", tone: "dark" }),
      screen("familish", "box", "box", { span: "full", tone: "light" }),
      screen("familish", "cake", "cake", { span: "half", tone: "light" }),
      screen("familish", "visit", "visit", { span: "half", tone: "light" }),
      screen("familish", "footer", "footer", { span: "full", tone: "dark" }),
    ],
  },
  {
    slug: "persona",
    year: 2026,
    client: "Persona Restaurant & Bar",
    showLogo: true,
    url: "https://personaam.netlify.app",
    status: "preview",
    services: ["business-website", "ui-ux-design", "crm-internal-systems"],
    directions: ["design", "development"],
    accent: "#B8473F",
    accentInk: "#FBEFE4",
    cover: screen("persona", "hero", "hero", { tone: "dark" }),
    gallery: [
      screen("persona", "walk-in", "walkIn", { span: "full", tone: "dark" }),
      screen("persona", "door", "door", { span: "half", tone: "dark" }),
      screen("persona", "voice", "voice", { span: "half", tone: "dark" }),
      phone("persona", "mobile-1", "mobile1"),
      phone("persona", "mobile-2", "mobile2"),
      phone("persona", "mobile-3", "mobile3"),
      phone("persona", "mobile-4", "mobile4"),
      screen("persona", "signatures", "signatures", { span: "full", tone: "dark" }),
      screen("persona", "rules", "rules", { span: "half", tone: "dark" }),
      screen("persona", "menu", "menu", { span: "half", tone: "dark" }),
      screen("persona", "rooms", "rooms", { span: "full", tone: "dark" }),
      screen("persona", "carpet", "carpet", { span: "half", tone: "dark" }),
      screen("persona", "footer", "footer", { span: "half", tone: "dark" }),
    ],
  },
  {
    slug: "dr-sona",
    year: 2026,
    client: "Zakaryan Dental · Dr. Sona Zakaryan",
    showLogo: true,
    url: "https://drsona.netlify.app",
    status: "preview",
    services: ["business-website", "ui-ux-design", "crm-internal-systems"],
    directions: ["design", "development"],
    accent: "#F2683C",
    accentInk: "#FFFFFF",
    cover: screen("dr-sona", "hero", "hero", { tone: "light" }),
    gallery: [
      screen("dr-sona", "about", "about", { span: "full", tone: "light" }),
      phone("dr-sona", "mobile-1", "mobile1"),
      phone("dr-sona", "mobile-2", "mobile2"),
      phone("dr-sona", "mobile-3", "mobile3"),
      phone("dr-sona", "mobile-4", "mobile4"),
      screen("dr-sona", "treatments", "treatments", { span: "half", tone: "light" }),
      screen("dr-sona", "results", "results", { span: "half", tone: "light" }),
      screen("dr-sona", "films", "films", { span: "full", tone: "light" }),
      screen("dr-sona", "steps", "steps", { span: "half", tone: "light" }),
      screen("dr-sona", "trained", "trained", { span: "half", tone: "light" }),
      screen("dr-sona", "stage", "stage", { span: "full", tone: "light" }),
    ],
  },
  {
    slug: "food-master",
    year: 2026,
    client: "Food Master Yerevan",
    showLogo: true,
    url: "https://foodmasteram.netlify.app",
    status: "preview",
    services: ["business-website", "ui-ux-design", "crm-internal-systems"],
    directions: ["design", "development"],
    accent: "#F4B533",
    accentInk: "#1E1A16",
    cover: screen("food-master", "hero", "hero", { tone: "dark" }),
    gallery: [
      screen("food-master", "davtashen", "davtashen", { span: "full", tone: "dark" }),
      phone("food-master", "mobile-1", "mobile1"),
      phone("food-master", "mobile-2", "mobile2"),
      phone("food-master", "mobile-3", "mobile3"),
      phone("food-master", "mobile-4", "mobile4"),
      screen("food-master", "shawarma", "shawarma", { span: "half", tone: "light" }),
      screen("food-master", "categories", "categories", { span: "half", tone: "dark" }),
      screen("food-master", "masters", "masters", { span: "full", tone: "light" }),
      screen("food-master", "club", "club", { span: "half", tone: "dark" }),
      screen("food-master", "footer", "footer", { span: "half", tone: "dark" }),
    ],
  },
  {
    slug: "vihan-school",
    year: 2024,
    client: "Fatemeh Mohammadi",
    showLogo: true,
    url: "https://www.fatemeh.me",
    services: ["brand-identity", "landing-page", "ui-ux-design"],
    directions: ["design", "development"],
    accent: "#F88032",
    accentInk: "#293335",
    palette: [
      { hex: "#FFEED4", key: "primary" },
      { hex: "#F88032", key: "accent" },
      { hex: "#293335", key: "secondary" },
    ],
    metric: { value: 100, suffix: "%" },
    cover: img("vihan-school", "01", 2000, 1500, "wallSign", { tone: "light" }),
    gallery: [
      img("vihan-school", "02", 2000, 1695, "symbol", { span: "half", tone: "dark" }),
      img("vihan-school", "15", 2000, 1500, "cardsMarble", { span: "half", tone: "dark" }),
      img("vihan-school", "04", 2000, 1500, "stationery", { span: "full", tone: "dark" }),
      img("vihan-school", "05", 2000, 1500, "cardArmchair", { span: "half" }),
      img("vihan-school", "06", 2000, 1500, "roundedCards", { span: "half", tone: "light" }),
      img("vihan-school", "10", 2000, 667, "pattern", { span: "full", tone: "light" }),
      img("vihan-school", "07", 2000, 1500, "citylight", { span: "half" }),
      img("vihan-school", "09", 2000, 1500, "idHolder", { span: "half", tone: "light" }),
      img("vihan-school", "08", 2000, 1500, "flags", { span: "full", tone: "light" }),
      img("vihan-school", "12", 2000, 1334, "squareSign", { span: "half" }),
      img("vihan-school", "13", 2000, 1500, "poster", { span: "half", tone: "light" }),
      img("vihan-school", "11", 2000, 1500, "cardGrid", { span: "half", tone: "light" }),
      img("vihan-school", "14", 2000, 1500, "stamp", { span: "half", tone: "light" }),
    ],
  },
  {
    slug: "eagle-vpn",
    year: 2025,
    client: null,
    showLogo: true,
    url: null,
    services: ["ui-ux-design", "mobile-app", "website-maintenance"],
    directions: ["design", "mobile-apps"],
    accent: "#4FA58C",
    accentInk: "#0E2A24",
    metric: { value: 10000, suffix: "+" },
    // The supplied renders sat on purple / beige studio backgrounds that clash with the site;
    // the devices are cut out and staged on the ONYQ background instead.
    cover: img("eagle-vpn", "cut-01", 1403, 1123, "screensLight", { cutout: true }),
    gallery: [img("eagle-vpn", "cut-pair", 763, 996, "podiumLight", { span: "full", cutout: true })],
  },
  {
    slug: "english-institute",
    year: 2025,
    client: null,
    showLogo: true,
    url: null,
    services: ["ui-ux-design", "business-website", "online-store", "crm-internal-systems", "smm"],
    directions: ["design", "development", "marketing"],
    accent: "#7B4DFF",
    accentInk: "#FFFFFF",
    metric: { value: 80, suffix: "%" },
    cover: img("english-institute", "01", 2000, 1500, "dashboardLaptop", { tone: "dark" }),
    gallery: [
      img("english-institute", "02", 2000, 1500, "scheduleDesk", { span: "full", tone: "dark" }),
      img("english-institute", "03", 2000, 1500, "storeFoldable", { span: "half", tone: "light" }),
      img("english-institute", "04", 2000, 1500, "storeLaptopDark", { span: "half", tone: "dark" }),
      img("english-institute", "05", 2000, 1500, "chatDark", { span: "half", tone: "dark" }),
      img("english-institute", "06", 2000, 1500, "dashboardFoldableDark", { span: "half", tone: "light" }),
      img("english-institute", "07", 2000, 1500, "scheduleDark", { span: "full", tone: "dark" }),
    ],
  },
];

export type CaseSlug = (typeof caseStudies)[number]["slug"];

export function getCase(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug);
}

export function nextCase(slug: string): CaseStudy {
  const i = caseStudies.findIndex((c) => c.slug === slug);
  return caseStudies[(i + 1) % caseStudies.length];
}
