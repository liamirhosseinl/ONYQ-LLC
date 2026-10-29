# Implementation notes

## Stack (pinned, all ≥ 2 weeks old at build time)

| Package | Version | Role |
|---|---|---|
| next | 16.3.8 | App Router, Turbopack, static generation, route handler |
| react / react-dom | 19.2.7 | |
| next-intl | 4.14.8 | Locale routing (`proxy.ts`), messages, formatting |
| gsap | 3.15.0 (+ ScrollTrigger) | Scroll choreography and hero sequence — the only animation engine |
| tailwindcss / @tailwindcss/postcss | 4.3.3 | Base + utilities; design lives in `styles/*.css` with tokens |
| zod | 4.6.5 | Enquiry schema shared by form and API |
| typescript | 5.9.3 | strict |
| @playwright/test | 1.56.1 | E2E, responsive and interaction tests |
| Node test runner | built-in (Node ≥ 22.18 runs `.ts` natively) | Unit tests — no extra dependency |

Next 16 notes: middleware is now `proxy.ts`; `params` are async; Turbopack is the default bundler. Next writes `AGENTS.md`/`CLAUDE.md` on `next dev` — they point AI tools at the bundled Next docs.

## Architecture

```
app/[locale]/…         routes (server components; static at build time)
app/api/enquiry        POST handler: zod → honeypot → rate limit → delivery
components/layout      header (menus, drawer), footer, preview ribbon, language switcher
components/home        hero, story visuals, comparison, letter composer, sections
components/motion      ScrollStory (GSAP), motion bootstrap + safety contract
components/page        page hero, topic template, price rows, accordion, next step, legal
components/pricing     PricingProvider (currency + campaign state), PriceTag, toggles, receipt, estimate
components/brief       BriefProvider (shared draft, sessionStorage), BriefFlow, BriefDialog
components/art         code-drawn artwork (geode, horizon)
content/en             all copy (home, topics, service pages, pricing, pages, catalogue)
data                   locale registry, services/prices, promotion, currency, navigation, site config
lib                    pricing engine, zoned time, enquiry schema + delivery, metadata, site mode
messages               UI strings (en complete; ru/hy placeholders, disabled)
styles                 tokens + section stylesheets
tests/unit, tests/e2e
```

Server/client boundary: pages, sections and artwork are server components. Client components are limited to interactive pieces (header, stories, comparison, letter, brief, price tags, toggles, accordion, tabs).

## Site mode

`NEXT_PUBLIC_SITE_MODE`: `preview` (default) or `production`.

| | preview | production |
|---|---|---|
| Copy marked `approval: "proposed"` | shown with a yellow "Needs ONYQ approval" marker | removed |
| "Preview build" ribbon | shown | hidden |
| `?promo=preview` | simulates the offer, clearly labelled | ignored |
| robots / meta robots | `Disallow: /`, `noindex` | indexable, sitemap advertised |

Verified on a production-mode build: no proposed blocks, no ribbon, promo preview ignored, robots allows `/` with the sitemap, FAQ shows 54 approved answers (67 in preview).

## Internationalisation

- `data/locales.ts`: `ALL_LOCALES = en, ru, hy`; `ENABLED_LOCALES = ["en"]`.
- Only enabled locales are routed, listed in `hreflang`/sitemap, or offered by the switcher (which renders nothing while only one locale is enabled).
- To enable RU/HY: translate `messages/<locale>.json` (run `npm run check:i18n` — it fails if an enabled locale is incomplete), add `content/<locale>/…` modules and register them in `content/index.ts` / `content/catalogue.ts`, add Cyrillic/Armenian font subsets, then add the locale to `ENABLED_LOCALES`.
- No string concatenation for sentences; ICU plurals for timelines.

## Enquiries

`/api/enquiry` accepts same-origin posts only (403 otherwise). It caps the body at 16 KB, validates with the same zod schema as the form, drops honeypot submissions silently, and rate-limits each IP to 5 per 10 min and 20 per day (limits are stored in SQLite, so they hold across restarts). Then it:

1. **stores the brief** in the admin Inbox (`leads` table, with the page and the visitor's path);
2. optionally forwards it:
   - `ENQUIRY_WEBHOOK_URL` (+ optional `ENQUIRY_WEBHOOK_SECRET` → `X-ONYQ-Signature` HMAC-SHA256), **or**
   - `RESEND_API_KEY` + `ENQUIRY_TO_EMAIL` + `ENQUIRY_FROM_EMAIL` (email via Resend).

The form shows success only when the brief was stored or delivered; otherwise (502) it offers "Try again" and "Copy brief".

The draft lives in `sessionStorage` (per tab, cleared on success) so the letter composer, the dialog and the contact page share answers.

## Configuration checklist

| Need | Where |
|---|---|
| Canonical URL | `NEXT_PUBLIC_SITE_URL` |
| Contacts, socials, legal name, tax ID, address | `data/site-config.ts` |
| Legal documents | `data/site-config.ts → legal` (routes appear automatically) |
| Team / products / case studies | `data/site-config.ts` (currently empty → sections omitted) |
| Promotion | `data/promotion.ts` |
| AMD policy | `data/currency.ts` |
| Price list date | `data/services.ts → PRICE_LIST_EFFECTIVE_FROM` |

## Deployment

See `docs/deployment.md` (Docker + Caddy, or Node + nginx). A persistent disk is required for the admin database.

## Known limitations

- About page uses the shared template, not the reference's bespoke animated intro.
- SQLite suits a single server. Running several app instances would need a shared database (Postgres); the data layer is isolated in `lib/server/` for that.
- Motion not profiled on a throttled mobile device in this environment.
- Analytics are cookieless and store no personal identifiers, so no consent banner is installed. Add one if third-party tracking (ads pixels) is ever added.

## v2 notes

- **Themes:** `html[data-theme="dark"|"light"]`, chosen before paint by `MotionBootstrap` (saved choice in `localStorage["onyq.theme"]`, else the system preference). Tokens in `styles/tokens.css`; `.theme-dark` / `.theme-light` force a theme on a block (the footer and the "next step" panels are always forest).
- **Languages:** `next-intl` with `localePrefix: "as-needed"` — English at `/`, Russian at `/ru`, Armenian at `/hy`. UI strings in `messages/*.json` (`npm run check:i18n` compares keys), long-form copy in `content/<locale>/` (typed by `content/types.ts`, loaded with `getContent(locale)`).
- **Numbers:** `lib/format.ts` formats prices and counters identically on the server and in the browser (Intl's Armenian data differs between Node and Chrome, which caused hydration mismatches). EN `$4,900`; RU/HY `4900 $`, `10 000`.
- **Fonts:** self-hosted in `styles/fonts.css` (no `next/font`), preloaded from the locale layout.
- **Case studies:** `data/cases.ts` + `content/*/cases.ts`, images in `public/work/<slug>/` (WebP). Guide: `docs/portfolio-intake.md`.
- **Long words:** Armenian and Russian headings are size-capped on narrow screens and grid children use `min-width: 0`, so no word is cut off at 360 px (checked by the responsive e2e test on EN/RU/HY pages).

## v3 notes (21 Oct 2026)

- **Scenes:** `components/art/Scene.tsx` renders the owner's day/night panoramas (`public/scene/`) with living overlays — twinkling stars, breathing moon/sun, blinking city lights, rising motes, a light sweep and the ONYQ spark glowing inside the glass sphere (hero) and the arch (footer). The picture switches with the theme.
- **Night palette:** near-black forest (`--night-0…4` in `styles/tokens.css`). The day palette is unchanged.
- **Armenian type:** `styles/lang-hy.css` is generated by `scripts/gen-hy-type.py` (all display sizes scaled down proportionally). Re-run it after changing any font size.
- **Logo:** the Q is one outline (`MARK_OUTLINE` in `brand-geometry.ts`) — no separate tail shape, so it never shows a seam or a second colour.
- **Home:** six-stage "How an idea comes alive" (`Journey.tsx`), real-work "What we do" scenes (`Showcase.tsx`), expanding work row (`WorkAccordion.tsx`), six-direction comparison, one cohesive ending (promise → footer scene → index; one brief button).
- **Content & video:** new direction `/content`, a fourth capability, and the Amir Khaldari case (website screenshots + real reels from the owner's artifact).
- **Case images:** Eagle VPN devices were cut out of their purple/beige backdrops (`cut-01.webp`, `cut-pair.webp`) and staged on the site's own ground; galleries are capped at 1080 px; the "next project" block was removed.

## v4 notes (22 Oct 2026)

- **First-visit animations.** The motion bootstrap is now a nonce-tagged inline `<script>` in `<head>`, so it runs before any bundle. The safety watchdog no longer disables motion for good: if the bundle arrives late (a cold cache or slow network), `motionAllowed()` turns full motion back on. Verified with JS delayed by 9 s and 26 s.
- **Copy.** Every section label, heading, slogan and button that echoed the reference was reworded in EN/RU/HY, with the same meaning and nothing removed. The brand-book line "intelligence, naturally." is ONYQ's own and stays.
- **Security.** Nonce-based strict CSP, the full header set, rate limits stored in the database, same-origin checks and RFC 9116 security.txt. See `docs/security.md`.
- **Admin panel** (`/admin`, `docs/admin-guide.md`). Built with server components and server actions on `node:sqlite` (`lib/server/*`).
  - Analytics come from `components/analytics/Tracker.tsx` → `/api/a`.
  - Site contacts are now editable from the panel (`lib/server/site-settings.ts` → `ContactProvider`).
- **Tests.** 30 unit + 79 e2e, including `tests/e2e/security.spec.ts`. E2E runs against a throwaway `.e2e-storage` database.

## v4.1 notes (27 Oct 2026)

- Security pass after a penetration test — the findings and fixes are in `docs/security.md` §8.
- Next.js 16.4.3 and zod 4.6.7.
- DB migration 2 adds `must_change_password` and `totp_last_step`.
- The schema now lives in `lib/server/migrations.mjs`, shared with `scripts/admin.mjs`.
- New env `ONYQ_TRUST_PROXY`.
- Tests: 38 unit + 83 e2e.

## v4.2 notes (30 Oct 2026)

- **RU/HY animations frozen.** The language switcher swapped the root layout on the client, which dropped `data-theme`/`data-motion` from `<html>`. Switching language is now a full page load (`components/layout/LanguageSwitcher.tsx`). Covered by an e2e test. Per-language font sizes are unchanged.
- **Mobile overlaps.** In pinned stories on phones, the visual now takes only the height the text leaves and is clipped (`styles/story.css`, `styles/showcase.css`), so a picture can't cover a heading.
- The Amir Khaldari case is first in the portfolio and links to www.amirkhaldari.me.
- New contacts:
  - phones +374 94 809506 and +374 94 406207;
  - email onyq.llc@gmail.com;
  - TIN 01384049, in the footer and on the contacts page.
- The admin phone field accepts several comma-separated numbers.
