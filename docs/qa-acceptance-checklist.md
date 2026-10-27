# QA / acceptance checklist (brief §14)

Status on 18 Oct 2026. ✅ done and tested · ⏳ waiting for ONYQ input · ➖ deliberate, documented deviation.

## Content and routes
- ✅ All approved routes exist with ONYQ content (30 routes; `tests/e2e/routes.spec.ts` loads each directly and checks one `h1`, title, canonical, no runtime errors).
- ✅ No reference branding, products, client work, people, contacts, tax ID or legal links (automated check for banned strings on key pages).
- ✅ No invented customers, testimonials, awards or metrics. Concept studies are labelled "Illustrative concept — not a client project".
- ✅ Service names, categories, regular starting prices and timelines match the approved seed catalogue (unit + e2e tests).
- ⏳ Owner confirmation that the 25-item catalogue is ONYQ's public offer (brief §16.10).
- ✅ Only complete locales are visible (EN only; RU/HY disabled with a key-parity check script).
- ⏳ Footer/contact/legal links: only configured channels render. None are configured yet; legal routes return 404 until documents exist.

## Design and animation
- ✅ Homepage section map compared with the live reference (`homepage-section-map.md`).
- ✅ Menu open/close (click, hover-intent, Esc + focus return, click outside, route change) and mobile drawer (focus trap, Esc, inert background) — e2e tested.
- ✅ Pinned stories: hero recede + 5 scroll stories with stage tabs and progress lines; tab click jumps to the stage (e2e tested).
- ✅ Comparison works with mouse, keyboard (←/→) and touch; letter composer; brief flow; topic tabs (arrow keys) — e2e tested.
- ✅ Hover / focus-visible / pressed / selected (`aria-pressed`, `aria-selected`, `aria-current`) / disabled states styled.
- ➖ Artwork is original and code-drawn; brand is provisional until the Brand Book (see `assets-and-brand-mapping.md`).
- ✅ Reduced motion: no pinning, all panels readable (e2e tested); JS-failure watchdog restores readable flow.
- ✅ Screenshots reviewed at 1440×900, 1280×800, 768×1024, 390×844, 360×800 for home, pricing, a service page, a direction page, contacts, FAQ, portfolio, footer and menu states; no horizontal overflow and no clipped content (automated).

## Pricing / promotion
- ✅ One data source (`data/services.ts`), one renderer (`PriceTag`).
- ✅ Currency toggle updates every displayed price; state shareable via `?currency=amd`.
- ✅ AMD rate source and rounding documented — ⏳ policy still provisional.
- ✅ 59 % maths correct for all 25 services; monthly "first month only, then regular" shown next to each offer price.
- ⏳ Campaign dates and eligibility (quote validity, combinability) — `promotion.enabled = false` until provided.
- ✅ Before / at start / during / end boundary / after expiry tests pass; expiry re-evaluates in the browser at the exact instant.
- ✅ With the promotion disabled, no offer, badge, countdown or "59 %" text appears (e2e tested).

## Functional / technical
- ✅ Every CTA has a real action (brief dialog, page link or anchor); no `href="#"`; internal links crawled on key pages.
- ⏳ Enquiry destination: webhook and Resend adapters implemented and tested (unit + local end-to-end webhook with HMAC). Success/failure/not-configured UI states tested. Needs ONYQ's real destination.
- ✅ Direct refresh of every route and branded 404 for unknown paths.
- ✅ Metadata per page (title, description, canonical, Open Graph, Twitter), JSON-LD (Service + FAQPage with approved answers only), sitemap, robots (preview: disallow all; production: allow + sitemap), `hreflang` only for enabled locales.
- ✅ Keyboard navigation, visible focus, skip link, landmarks, one `h1` per page, form labels and error messages linked with `aria-describedby`.
- ✅ Production build succeeds; no console or runtime errors in tested flows.
- ✅ Limitations and missing inputs listed (`implementation-notes.md`, `onyq-inputs-and-approvals.md`).

## Test inventory

| Suite | Count | Command |
|---|---|---|
| Unit (pricing, promotion boundaries, time zones, AMD, enquiry, content/route integrity, RU/HY message parity, case studies + NDA, number formatting) | 30 | `npm test` |
| E2E routes (EN/RU/HY, case pages, hreflang, NDA), SEO, leaks, dead links | 48 | `npm run test:e2e` |
| E2E interactions (menus, drawer, pricing, promo preview, brief flow, letter, comparison, stories, FAQ, tabs, reduced motion, theme toggle, language switch) | 19 | `npm run test:e2e` |
| E2E responsive (5 viewports × 11 pages incl. RU/HY + footer + menu, overflow and clipping) | 5 | `npm run test:e2e` |

All 102 passed on the final v2 preview build (19 Oct 2026). E2E tests expect a **preview-mode** build (`npm run build && npm run test:e2e`).
