# ONYQ website

Multi-page marketing site for **ONYQ**, a software company registered in Armenia.
Built from a clean Next.js setup. A public studio site served only as an early reference for structure and interaction patterns (see `docs/reference-audit.md`); all copy, artwork and code are ONYQ's own, and the v4 copy pass reworded every heading, slogan and label that echoed it.

> **Final (27 Oct 2026).** All proposed copy approved by ONYQ; production mode is the default and the canonical domain is https://onyq.am.
>
> **v4.1 (27 Oct 2026).** Security pass: Next.js 16.4.3, penetration-test fixes (see `docs/security.md` §8), forced change of temporary passwords, and the `npm run admin` recovery tool for lost passwords.
>
> **v4.** Admin panel at `/admin` (analytics, inbox, clients, pipeline, tasks, finance, team, audit log — `docs/admin-guide.md`), security hardening to OWASP ASVS L2 (`docs/security.md`), Docker/Caddy deployment (`docs/deployment.md`), first-visit animation fix, and a full copy rewrite in EN/RU/HY.
>
> **v2.** Brand book applied (logo, palette, type, "intelligence, naturally."), day/night themes, English / Russian / Armenian, three real case studies and a new motion system (Lenis smooth scroll, GSAP, word-by-word reveals, page curtain, custom cursor). Several commercial statements still await ONYQ's approval — see `docs/onyq-inputs-and-approvals.md`. To add projects: `docs/portfolio-intake.md`.

## Quick start

Requirements: **Node.js 22.18+** (the admin panel uses the built-in `node:sqlite`; the unit tests use Node's built-in TypeScript support). Data is stored in `./storage` (or `ONYQ_DATA_DIR`). On first start, open `/admin` and use the token from `storage/setup-token.txt`.

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## Tests

```bash
npm test                         # 38 unit tests (pricing, promotion boundaries, AMD, enquiry, content integrity)
npx playwright install chromium  # once, if Chromium isn't installed
npm run build && npm run test:e2e   # browser tests: 5 viewports, RU/HY routes, themes, case pages, brief → inbox, security headers/CSP/admin protection
npm run typecheck
npm run check:i18n               # translation completeness for RU/HY
```

## Configuration

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_MODE` | `production` (default) or `preview` (approval markers, `?promo=preview`, noindex) |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin (default `https://onyq.am`) |
| `ENQUIRY_WEBHOOK_URL`, `ENQUIRY_WEBHOOK_SECRET` | Deliver briefs to a webhook (CRM, Make/Zapier, backend) |
| `RESEND_API_KEY`, `ENQUIRY_TO_EMAIL`, `ENQUIRY_FROM_EMAIL` | Or deliver briefs by email via Resend |
| `ONYQ_DATA_DIR` | Folder for the admin/analytics database (default `./storage`) — persistent, private, backed up |
| `ONYQ_TRUST_CLOUDFLARE` | `1` only behind Cloudflare |

Briefs are always saved to the admin Inbox; the webhook/email options forward them in addition.

Business data lives in `data/` — prices (`services.ts`), the 59 % campaign (`promotion.ts`), AMD policy (`currency.ts`), contacts/legal/team (`site-config.ts`), languages (`locales.ts`). Copy lives in `content/{en,ru,hy}/` and `messages/{en,ru,hy}.json`; case studies in `data/cases.ts` + `content/*/cases.ts`.

## Documentation

| File | Contents |
|---|---|
| `docs/reference-audit.md` | What was inspected on the reference and how |
| `docs/sitemap-and-routing.md` | Every route and its status |
| `docs/homepage-section-map.md` | Reference vs ONYQ, section by section |
| `docs/design-and-layout-spec.md` | Measured reference values and the ONYQ token mapping |
| `docs/motion-and-interaction-spec.md` | Every animation and interaction |
| `docs/service-content-inventory.md` | Service scope sources and items to confirm |
| `docs/pricing-and-promotion-rules.md` | Catalogue, 59 % rules, AMD policy, tests |
| `docs/assets-and-brand-mapping.md` | Provisional identity, artwork origin, fonts |
| `docs/implementation-notes.md` | Stack, architecture, site mode, i18n, enquiries, deployment |
| `docs/qa-acceptance-checklist.md` | Brief §14 checklist with status |
| `docs/onyq-inputs-and-approvals.md` | Everything ONYQ still needs to provide or approve |
| `docs/portfolio-intake.md` | How to add the next portfolio projects |
| `docs/admin-guide.md` | The admin panel, section by section |
| `docs/security.md` | Security controls and standards mapping |
| `docs/deployment.md` | Hosting, HTTPS, first run, backups, updates |

`review-screenshots/` holds screenshots from the final test run (1440, 1280, 768, 390 and 360 px, EN/RU/HY) for quick review without running the site.
