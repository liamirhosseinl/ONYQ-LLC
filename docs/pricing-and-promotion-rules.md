# Pricing and promotion rules

## Single source of truth

| What | File |
|---|---|
| 25 services: id, category, regular USD price, billing type, timeline, detail page, promo eligibility, ad-spend flag | `data/services.ts` |
| Names and short descriptions (per locale) | `content/en/catalogue.ts` |
| 59 % campaign configuration | `data/promotion.ts` |
| AMD conversion policy | `data/currency.ts` |
| All maths (promo state, discount, conversion, formatting) | `lib/pricing.ts` |
| The only component that prints a price | `components/pricing/PriceTag.tsx` |

No component stores a price. Receipts, rows, estimate cards, service cards, "see also" cards, concept pages and the brief summary all render `PriceTag`, so currency and promotion changes apply everywhere at once.

Seed catalogue: https://arevian.studio/price ("prices valid from 23 September 2026"), **re-checked live on 18 Oct 2026 — all 25 entries matched the brief exactly** (names, starting prices, timelines, monthly vs one-time). The reference's validity date is not ONYQ's; `PRICE_LIST_EFFECTIVE_FROM` stays `null` until ONYQ sets its own date.

## Catalogue

| Category | Service | Regular (USD) | Promo −59% (USD) | Regular (AMD, provisional) | Promo (AMD, provisional) | Timeline | Billing | Page |
|---|---|---:|---:|---:|---:|---|---|---|
| Websites | Landing page | $790 | $323.90 | 286,000 ֏ | 117,000 ֏ | From 7 days | One-time project | `/services/landing-page` |
| Websites | Website redesign | $890 | $364.90 | 322,000 ֏ | 132,000 ֏ | From 3 weeks | One-time project | `/services/website-redesign` |
| Websites | Business website | $1,190 | $487.90 | 431,000 ֏ | 177,000 ֏ | From 2 weeks | One-time project | `/services/corporate-website` |
| Websites | Corporate website | $1,990 | $815.90 | 720,000 ֏ | 295,000 ֏ | From 4 weeks | One-time project | `/services/corporate-website` |
| Websites | Online store | $4,900 | $2,009 | 1,774,000 ֏ | 727,000 ֏ | From 6 weeks | One-time project | `/services/online-store` |
| Websites | Web service or portal | $9,900 | $4,059 | 3,584,000 ֏ | 1,469,000 ֏ | From 2 months | One-time project | `/development` |
| Design & brand | Logo | $390 | $159.90 | 141,000 ֏ | 58,000 ֏ | From 7 days | One-time project | `/services/branding` |
| Design & brand | Brand identity & brand book | $1,490 | $610.90 | 539,000 ֏ | 221,000 ֏ | From 3 weeks | One-time project | `/services/branding` |
| Design & brand | Website UI/UX design | $490 | $200.90 | 177,000 ֏ | 73,000 ֏ | From 10 days | One-time project | `/services/ux-ui-design` |
| Design & brand | UX audit | $290 | $118.90 | 105,000 ֏ | 43,000 ֏ | From 5 days | One-time project | `/services/ux-ui-design` |
| Apps & bots | Telegram bot or mini app | $590 | $241.90 | 214,000 ֏ | 88,000 ֏ | From 10 days | One-time project | `/services/telegram-bot` |
| Apps & bots | Integrations & payments | $290 | $118.90 | 105,000 ֏ | 43,000 ֏ | From 5 days | One-time project | `/services/integrations-payments` |
| Apps & bots | CRM & internal systems | $5,900 | $2,419 | 2,136,000 ֏ | 876,000 ֏ | From 6 weeks | One-time project | `/development` |
| Apps & bots | Mobile app | $6,900 | $2,829 | 2,498,000 ֏ | 1,024,000 ֏ | From 2 months | One-time project | `/mobile-apps` |
| Artificial intelligence | AI assistant for your website | $990 | $405.90 | 358,000 ֏ | 147,000 ֏ | From 2 weeks | One-time project | `/services/ai-assistant` |
| Artificial intelligence | AI integration & automation | $1,990 | $815.90 | 720,000 ֏ | 295,000 ֏ | From 4 weeks | One-time project | `/services/ai-assistant` |
| Marketing & promotion | SEO | $350/mo | $143.50/mo (1st month) | 127,000 ֏ | 52,000 ֏ | Monthly | Recurring monthly | `/services/seo` |
| Marketing & promotion | Search & display ads | $390/mo | $159.90/mo (1st month) | 141,000 ֏ | 58,000 ֏ | Monthly | Recurring monthly; ad spend separate | `/services/search-ads` |
| Marketing & promotion | SMM & paid social | $450/mo | $184.50/mo (1st month) | 163,000 ֏ | 67,000 ֏ | Monthly | Recurring monthly; ad spend separate | `/services/smm` |
| Marketing & promotion | AI search visibility | $590/mo | $241.90/mo (1st month) | 214,000 ֏ | 88,000 ֏ | Monthly | Recurring monthly | `/services/seo` |
| Marketing & promotion | Website audit | $250 | $102.50 | 91,000 ֏ | 37,000 ֏ | From 5 days | One-time project | `/services/website-audit` |
| Analytics & growth | Business analytics & dashboards | $990 | $405.90 | 358,000 ֏ | 147,000 ֏ | From 2 weeks | One-time project | `/business-analytics` |
| Analytics & growth | Financial model | $790 | $323.90 | 286,000 ֏ | 117,000 ֏ | From 10 days | One-time project | `/financial-consulting` |
| Analytics & growth | Gamification & loyalty | $1,490 | $610.90 | 539,000 ֏ | 221,000 ֏ | From 4 weeks | One-time project | `/gamification` |
| Support | Website maintenance | $99/mo | $40.59/mo (1st month) | 36,000 ֏ | 15,000 ֏ | Monthly | Recurring monthly | `/services/website-maintenance` |

Promo USD = regular × 41 %, computed in integer cents and rounded half-up to 2 decimals — the result equals the approved table in brief §5 for all 25 services (asserted in `tests/unit/pricing.test.ts`).

## 59 % campaign rules (as implemented)

- **Config:** `enabled` (false), `discountPercent` 59, `startLocal` / `endLocal` as `"YYYY-MM-DD HH:mm"` wall-clock in `timezone` `Asia/Yerevan`.
- **Window:** `[start, end)` — active from the exact start minute; ends exactly at the end minute. Times are converted with a time-zone-aware `Intl` routine (no reliance on the visitor's device zone). Malformed or impossible dates throw, and an inverted window throws — the UI then shows regular prices.
- **States:** `disabled` → regular only · `unconfigured` (enabled without dates) → regular only · `scheduled` → regular + "offer starts …" note · `active` → offer price, struck regular price, rules block, countdown to the real end time · `ended` → regular only.
- **Expiry:** pages are static; the campaign state is resolved in the browser and re-resolved with a timer at the exact start/end instant (and when the tab becomes visible), so a cached page can't keep showing an expired offer.
- **One-time projects:** offer price applies to projects confirmed during the window.
- **Monthly services:** first paid month at −59 %; from the second month the regular price — shown next to every monthly offer price ("first month · then $350/mo from the second month").
- **Ad budgets:** never discounted, always paid separately to the platforms (stated on rows, pages and in the rules).
- **Countdown:** only when active, computed from the configured end time; disappears with the offer. No evergreen countdown exists.
- **Preview:** in preview mode `/price?promo=preview` (any page) shows the offer UI with a "Promotion preview — not live" notice. Ignored in production mode.

### To launch the campaign

1. Get approved start/end (Asia/Yerevan), quote-validity rule and combinability rule from ONYQ.
2. Edit `data/promotion.ts`: `enabled: true`, `startLocal`, `endLocal`, `quoteValidityRule`, `combinableWithOtherOffers`.
3. `npm test` — boundary tests must pass. Deploy with `NEXT_PUBLIC_SITE_MODE=production`.

[ONYQ INPUT REQUIRED] start/end, what happens if a brief arrives before expiry but the quote is approved after, and whether offers combine.

## AMD

- **Policy (PROVISIONAL):** one central rate, **362 ֏ per $1** (Wise mid-market quote 362.3 on 13 Oct 2026, rounded down), every converted amount rounded to the nearest **1,000 ֏** (halves up). Regular and offer AMD prices are both converted from USD with the same function.
- A note under every AMD view states the rate and rounding. Marked "Provisional rate" until `status: "APPROVED"`.
- [ONYQ INPUT REQUIRED] choose: fixed owner-managed rate, manually updated rate, or an explicit live source. The reference sets AMD prices by hand (e.g. 290,000 ֏ for $790); if ONYQ prefers hand-set AMD prices, add an optional `amdOverride` per service in `data/services.ts` and keep the formatter.

## Tests

`tests/unit/pricing.test.ts` (14 tests): catalogue integrity, all 25 promo amounts, production config disabled, disabled/unconfigured → regular, Yerevan time conversion, before start, exactly at start, during, end boundary (−1 ms active / exact end ended), after expiry, monthly first vs later invoices, inverted window rejected, AMD rounding, money formatting.
`tests/e2e/interactions.spec.ts`: currency toggle on every row + URL persistence, 25 rows with approved prices, no offer while disabled, preview maths and monthly wording.
