/**
 * Navigation structure. Labels live in messages/<locale>.json under "nav".
 * The reference menu also has "Products" and a client sign-in; both are omitted
 * because ONYQ has no approved public products or client accounts (brief §1.2, §11.5).
 */

export type DirectionSlug =
  | "design"
  | "development"
  | "ai"
  | "mobile-apps"
  | "marketing"
  | "gamification"
  | "business-analytics"
  | "financial-consulting"
  | "content";

export const DIRECTION_SLUGS: DirectionSlug[] = [
  "design",
  "development",
  "mobile-apps",
  "ai",
  "marketing",
  "content",
  "gamification",
  "business-analytics",
  "financial-consulting",
];

export interface NavLink {
  key: string;
  href: string;
}

export interface NavMenu {
  key: "services" | "studio";
  /** "Explore section" target */
  href: string;
  links: NavLink[];
}

export type NavItem = { type: "link"; key: string; href: string } | ({ type: "menu" } & NavMenu);

export const primaryNav: NavItem[] = [
  { type: "link", key: "work", href: "/portfolio" },
  {
    type: "menu",
    key: "services",
    href: "/services",
    links: DIRECTION_SLUGS.map((slug) => ({ key: slug, href: `/${slug}` })),
  },
  { type: "link", key: "pricing", href: "/price" },
  {
    type: "menu",
    key: "studio",
    href: "/about",
    links: [
      { key: "about", href: "/about" },
      { key: "howWeWork", href: "/how-we-work" },
      { key: "portfolio", href: "/portfolio" },
      { key: "faq", href: "/faq" },
      { key: "contacts", href: "/contacts" },
    ],
  },
];

/** Popular services shown in the footer — must exist as /services/[slug] pages. */
export const footerPopular = [
  "landing-page",
  "corporate-website",
  "online-store",
  "seo",
  "telegram-bot",
  "ai-assistant",
] as const;
