# Sitemap and routing

Routing: Next.js App Router under `app/[locale]/…` with `next-intl`, `localePrefix: "as-needed"`.
English (default) has no prefix (`/price`); Russian/Armenian will live at `/ru/…` and `/hy/…` once enabled.
`proxy.ts` (Next 16's renamed middleware) rewrites un-prefixed URLs to the default locale.

| Route | Status | Template | Notes |
|---|---|---|---|
| `/` | ✅ | Home | 12 sections, see homepage map |
| `/services` | ✅ | Services index | 8 directions + 25 services with prices |
| `/design` `/development` `/ai` `/mobile-apps` `/marketing` `/gamification` `/business-analytics` `/financial-consulting` | ✅ | `TopicPage` | Financial consulting is framed around the catalogue's *Financial model* service — confirm scope (brief §3) |
| `/services/[slug]` × 14 | ✅ | Service detail | `landing-page`, `website-redesign`, `corporate-website` (business + corporate), `online-store`, `integrations-payments`, `website-maintenance`, `branding` (logo + identity), `ux-ui-design` (UI/UX + UX audit), `telegram-bot`, `ai-assistant` (assistant + automation), `seo` (SEO + AI search visibility), `search-ads`, `smm`, `website-audit` |
| `/price` | ✅ | Pricing | Single data source, USD/AMD, promotion rules |
| `/portfolio` | ✅ | Concept studies | Labelled illustrations only — no client work exists yet |
| `/about` | ✅ | `TopicPage` | Facts limited to "software company registered in Armenia" + services |
| `/how-we-work` | ✅ | `TopicPage` | Commercial commitments flagged "proposed" |
| `/faq` | ✅ | FAQ | Aggregated from service/pricing FAQs (67 in preview, 54 in production) |
| `/contacts` | ✅ | Contact | Working multi-step brief + configured channels |
| `/privacy-policy` `/terms` `/cancellation` | ⏳ | Legal | Return **404** and are unlinked until ONYQ adds approved text in `data/site-config.ts → legal` |
| `/work/[slug]` | ⛔ not created | — | Add when real, approved case studies exist |
| `/team` `/partnership` `/products` | ⛔ not created | — | Brief: conditional — no approved content |
| `/api/enquiry` | ✅ | Route handler | POST only; zod validation, honeypot, rate limit, webhook/Resend delivery |
| `/sitemap.xml` `/robots.txt` | ✅ | Metadata routes | Robots disallows everything in preview mode |
| anything else | ✅ | Branded 404 | `app/[locale]/not-found.tsx` via catch-all `[...rest]` |

Services without a dedicated detail page link to their direction page (as on the reference):
web service/portal and CRM → `/development`, mobile app → `/mobile-apps`, business analytics → `/business-analytics`, financial model → `/financial-consulting`, gamification & loyalty → `/gamification`.

`tests/unit/content.test.ts` fails the build pipeline if any service, nav item, footer link or related-topic link points to a route that doesn't exist; `tests/e2e/routes.spec.ts` crawls internal links on key pages and loads every route directly (refresh-safe).
