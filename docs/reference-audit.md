# Reference audit — arevian.studio

**Inspected:** 18 October 2026, in a real Chromium browser (Claude desktop browser pane), plus DOM/CSS inspection with in-page JavaScript.
**Viewports used:** 1440 × 900 (emulated), 390 × 844 (emulated, mobile UA), and the pane's native ~773 × 910.
**Purpose:** reverse-engineer the *observable* experience (structure, layout, motion, interaction, price catalogue). No source code, images, fonts, videos or copy were downloaded or reused.

> Reference screenshots were viewed during inspection but are **not** stored in this repository, so no Arevian imagery is redistributed with the ONYQ project. Re-inspect the live site if a visual comparison is needed.

## Method

1. Loaded each page, extracted visible text (`main` content) and the accessibility tree.
2. Measured layout with `getBoundingClientRect` / `getComputedStyle` (section heights, sticky positions, type sizes, colours, CSS custom properties, header CSS rules).
3. Scrolled the homepage in fixed steps and captured each stage of the pinned stories.
4. Opened the mobile drawer, the "Let's talk" brief overlay and switched the pricing currency toggle.
5. Followed every price-row link to the service detail pages and recorded their structure.

## Pages inspected

| URL | Purpose | Observed structure | ONYQ decision |
|---|---|---|---|
| `/` | Homepage | 12 sections; see `homepage-section-map.md` | Rebuilt with original copy/art |
| `/price` | Price catalogue | Hero + "Most requested" receipt + USD/AMD toggle → 7 category anchors → category sections (title, lead, "More about the service", rows: name, short desc, timeline, "from" price, Discuss) → "In every price" (4) → "What the final price depends on" (4) → pricing FAQ (7) → next-step CTA with artwork + "What happens next" (3) → footer | Rebuilt 1:1 in structure; prices from `data/services.ts` |
| `/services` | Services index | "8 directions" list → "Specific services" grouped by direction with from-prices → CTA | Rebuilt |
| `/design`, `/development`, `/ai`, `/mobile-apps`, `/marketing`, `/gamification`, `/business-analytics`, `/financial-consulting` | Direction pages | Eyebrow index + label → H1 (2 lines, 2nd accent) + lead + CTA → "How the result comes together" approach card + 4-tab "Explore this discipline" → "What's inside — 04 directions" rows → "Services in this area" cards with from-price → evidence cards (their projects) → statement + 3 stat/principle columns → "Where to go next" → next step | Rebuilt as one `TopicPage` template; evidence section removed (no ONYQ cases) |
| `/services/landing-page`, `redesign`, `corporate-website`, `online-store`, `payment-integration`, `website-support`, `branding`, `ux-ui-design`, `telegram-bot`, `ai-chatbot`, `seo`, `google-ads`, `smm`, `website-audit` | Service detail | Breadcrumb → H1 + lead + CTAs → paper "Estimate" card (from price, timeline, 5 inclusions) → "What your business gets" (3) → "What's included" (8) → "How the work goes" (4 stages + durations) → good fit / better choose (with alternative + price) → evidence → pricing rows (3) → Questions (FAQ) → See also (4) → next step | Rebuilt as `/services/[slug]` (14 pages); scope rewritten — see `service-content-inventory.md` |
| `/how-we-work` | Process | Same template as directions (Discovery / Design / Build / Launch & support) | Rebuilt with commitments flagged "proposed" |
| `/faq` | FAQ | 52 questions in 16 groups with topic index | Rebuilt by aggregating ONYQ FAQs |
| `/contacts` | Contact | Direction template with channels (email, partnership, security, office) | Replaced by a working brief form; channels shown only when configured |
| `/about` | Studio | Custom animated page (progress counter, discipline list, local clock) | Rebuilt with the topic template — the animated intro was **not** reproduced (see limitations) |
| `/portfolio` | Work | 3 project cards (their clients) | Replaced by labelled concept studies |

Navigation-only routes (team, partnership, regions, Armenia IT programme, products, product subpages, login) were catalogued from the menu but **not rebuilt**: ONYQ has no approved team profiles, partnership offer, initiatives, products or client accounts.

## Global chrome (observed)

- **Header:** fixed, 80 px (68 px ≤ 850 px). Logo left, centred nav (Work · Services ▾ · Pricing · Products ▾ · Studio ▾), right actions (theme toggle, language globe, sign-in, "Let's talk ↗" light pill, hamburger ≤ 1150 px). States: transparent over hero (`data-overlay`), translucent material background when scrolled (`data-material`), slides up while scrolling down (`data-away`, `transform .32s cubic-bezier(.22,1,.36,1)`).
- **Directory menu:** panel 12 px under the header, `min(1040px, 100% − gutters)`, radius 16, padding 32, grid `240px / 1fr`, gap 48; intro sentence (23 px) + "Explore section"; links in 2 columns, 52 px rows with bottom border, arrow nudges on hover; opening animation .22 s.
- **Mobile drawer:** full screen; numbered 01–05 links with large type; Services/Products/Studio as disclosures; "Let's make something matter." + "Let's talk" button; theme/sign-in; email.
- **"Let's talk":** opens a full-screen assistant ("Ari") with steps *Project / The story / Company / Contact*, language chips and a free-text input. ONYQ uses a plain multi-step brief instead (no AI persona — brief §12).
- **Footer:** large "Always in touch." over artwork, contacts, then 7 columns (company, studio links, services, popular services, social, emails, office).

## Limitations of this audit

- Motion durations were read from CSS where exposed (header, menu, panel transitions); scroll-story timings are **estimated from playback**, not measured frame-by-frame. Screen recording was not available in this environment.
- Tablet (768 px) was not inspected on the reference; the ONYQ tablet layout follows the reference breakpoints observed in CSS (1150 / 850 / 600 px).
- The reference light theme and the About page's bespoke intro animation were seen but not reproduced.
- Product sub-pages and external product sites were not opened (out of scope, brief §2.1).
