# ONYQ inputs and approvals still needed

> **27 Oct 2026:** ONYQ approved all copy that was marked "proposed" (the commercial commitments below). The markers are removed, and the site now builds in **production mode** by default (indexable, no preview label). Set `NEXT_PUBLIC_SITE_MODE=preview` for a review build.

Everything here is either empty in the configuration (so the site hides it) or visible in preview mode with a yellow **"Needs ONYQ approval"** marker (removed automatically in production mode).

## Inputs (brief §16)

| # | Input | Where it goes | What the site does until then |
|---|---|---|---|
| 1 | ~~Logo files + Brand Book~~ **Done (v2)** | `components/ui/brand-geometry.ts`, `Wordmark.tsx`, `styles/tokens.css`, `styles/fonts.css` | Brand book applied: lockup, spark mark, forest/field/cloud/volt/ember palette, day + night themes |
| 2 | Sales email and enquiry destination (webhook/CRM or email via Resend) | `data/site-config.ts → contact`, env vars | **v4:** briefs are always saved to Admin → Inbox; forwarding by webhook/email is optional |
| 3 | 59 % campaign start/end (Asia/Yerevan), quote-validity rule, combinability | `data/promotion.ts` | Promotion disabled |
| 4 | AMD pricing policy and rounding | `data/currency.ts` | 362 ֏/$, nearest 1,000 ֏, labelled provisional |
| 5 | ~~Languages~~ **Done (v2)** — EN (default, no prefix), RU (`/ru`), HY (`/hy`) | `data/locales.ts`, `messages/`, `content/` | Ask a native speaker to proofread RU and HY before launch |
| 6 | Legal name, registration/tax number, address (only if to be published); privacy policy, terms, cancellation | `data/site-config.ts` | Not shown; legal routes 404 |
| 7 | Team profiles (optional) | `data/site-config.ts → team` | Working principles instead of people |
| 8 | Case studies — **3 added (v2)**: Vihan School, Eagle VPN (NDA), English institute (client hidden). More coming | `data/cases.ts`, `content/*/cases.ts` — see `docs/portfolio-intake.md` | Concept studies kept below the real work, labelled |
| 9 | Product names/URLs (optional) | `data/site-config.ts → products` | No Products menu |
| 10 | Confirm all 25 services, prices, timelines, billing types | `data/services.ts` | Seed catalogue shown as-is |
| 11 | Price list effective date | `data/services.ts → PRICE_LIST_EFFECTIVE_FROM` | No "valid from" line |
| 12 | ~~Tagline~~ **Done (v2)** — "intelligence, naturally." (brand book) | `content/*/home.ts`, `data/site-config.ts` | — |
| 13 | Social profile URLs, Telegram/WhatsApp/phone | **v4:** Admin → Settings → Website contact details (or `data/site-config.ts`) | Hidden |
| 14 | Canonical domain | `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |

## Copy marked "proposed" (commercial commitments)

| Statement | Location |
|---|---|
| Code, accounts and source files belong to the client after payment | Home principles, development principles, service FAQs ("Who owns the result?"), pricing FAQ, "Always included" |
| Scope, timeline and price agreed **in writing** before work starts | "What happens next" step 3, "Always included", How-we-work principles |
| Payment by stages on a schedule agreed upfront | Pricing FAQ, "Always included", How-we-work |
| Regular demos on a working version | "Always included", How-we-work, FAQ |
| Price changes only with scope, estimated and agreed first | Pricing FAQ |
| Works with clients outside Armenia | Pricing FAQ |
| Maintenance response times | Maintenance FAQ |
| Logo rights transfer after payment | Branding FAQ |
| Direct contact channels note | Contacts page |

To approve an item, remove `approval: "proposed"` from it in `content/en/*.ts` (or remove the `<Proposed>` wrapper for the "Always included" block and the contacts note).

## Positioning statements to sanity-check

- "Registered in Armenia" — from the brief.
- "Built for where you sell … sites in English, Russian and Armenian" (homepage origin section).
- "One team, one context: design, engineering, AI and marketing planned together" (comparison section, principles).
- Service scope details flagged ⚠ in `service-content-inventory.md` (payment providers, 1C, AI model fees).

## New in v2 — to confirm

- Russian and Armenian copy was written for this site (not machine output), but should be proofread by a native speaker before launch.
- Case-study wording is translated from the owner's info.txt; results are exactly as reported (Vihan 100 % satisfaction, Eagle VPN 10,000+ users, English institute 80 %). No testimonials are shown because none were supplied.
- Fatemeh Mohammadi and fatemeh.me are shown publicly on the Vihan School case (show_client = yes).

## New in v3 — to confirm

- Content & video is a new direction (`/content`) with no catalogue price yet — enquiries go through the brief. Add a price to `data/services.ts` when ONYQ approves one.
- The Amir Khaldari case quotes the figures published on that site (963+ videos, 50M+ views, +25% retention).

## New in v4 — to confirm

- **Reworded copy:** review the new headings and slogans in all three languages (home sections 01–05, pricing, service pages, footer, the letter). The meaning is unchanged; ask for any line to be tuned.
- **Admin first run:** create the owner account with the setup token, enable two-factor, and fill in Settings → Website contact details (including a security contact for `security.txt`).
- **Exchange rates:** confirm the AMD/RUB/EUR → USD rates in Settings (used only for the admin's USD totals).
- **Hosting:** choose a VPS with a persistent disk and daily backups (`docs/deployment.md`).
- **Privacy policy:** mention the cookieless first-party analytics and that briefs are stored in ONYQ's own database (a counsel-reviewed text is still needed).
