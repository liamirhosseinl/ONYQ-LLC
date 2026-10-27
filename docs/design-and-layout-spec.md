# Design and layout spec

## Measured on the reference (1440 × 900)

| Property | Reference value | Source |
|---|---|---|
| Page background / surface / line | `#090909` / `#171717` / `#303030` | CSS custom properties `--v-paper`, `--v-surface`, `--v-line` |
| Ink / muted / accent | `#f1eee8` / `#aaa5a0` / `#ef8d60` (warm orange) | `--v-ink`, `--v-muted`, `--v-orange` |
| Fonts | Onest (UI + headings), MuseoModerno (logo), monospace for micro labels | computed `font-family` |
| Content width | 1328 px at 1440 (56 px side gutters), max 1640 px | `.v-wrap` |
| Header | 80 px, 68 px ≤ 850 px; edge gutter 24 + 14 px; max 1920 px | `.studio-navigation` rules |
| Breakpoints | 1150 px (nav → hamburger), 850 px (compact header), 600 px (short CTA), 360 px | header CSS |
| Section eyebrow | 11 px / 500 / uppercase / 0.88 px tracking | computed |
| Micro labels | 9 px monospace, 0.72 px tracking | computed |
| Story headline | 78–94 px, weight 450, line-height ≈ 0.98, tracking ≈ −0.055 em | computed |
| Section H2 | 52–63 px, tracking ≈ −0.055 em | computed |
| Closing statement | 106–112 px | computed |
| Primary CTA | pill (999 px radius), 74 px tall, 17 px text, padding 24/32, peach fill | computed |
| Header "Let's talk" | 44 px tall, 12 px radius, light fill | screenshot + CSS |
| Directory panel | `min(1040px, …)`, radius 16, padding 32, grid 240 px / 1fr, gap 48 | CSS |
| Two-tone headings | 2nd line in accent colour | observed |
| Paper surfaces | Receipt / estimate / letter cards on warm off-white, slightly rotated | observed |

## ONYQ token mapping (PROVISIONAL — `styles/tokens.css`)

| Role | Reference | ONYQ provisional | Why |
|---|---|---|---|
| Page | `#090909` | `#0c0d10` onyx | Cooler black — "polished onyx" |
| Surface | `#171717` | `#15171b` graphite | |
| Line | `#303030` | `#2a2d34` seam | |
| Ink | `#f1eee8` | `#ecebe6` bone | |
| Muted | `#aaa5a0` | `#9ea1aa` ash | |
| Accent | `#ef8d60` orange | `#b3b9ff` iris | Deliberate deviation: avoids visual confusion with the reference brand in the same market |
| Paper | warm off-white | `#e8e9ec` chalcedony | Cool paper to match the mineral palette |
| Display / UI font | Onest | **Geologica** (variable, with a *sharpness* axis) | Distinct geometric grotesk with Cyrillic; sharpness axis used for the provisional wordmark |
| Micro labels | monospace | **Geist Mono** | Same structural role |

Structural rules kept from the reference: dark editorial canvas, numbered section eyebrows (`01 / …`), very large tight headings with an accent second line, hairline separators, paper cards for prices and the letter, pill CTAs, generous vertical rhythm (section padding `clamp(88px, 10vw, 160px)`).

## Type scale (fluid, `clamp`)

`--fs-giant` 50→134 px · `--fs-display` 43→106 px · `--fs-h1` 40→86 px · `--fs-h2` 34→64 px · `--fs-h3` 25→44 px · `--fs-h4` 20→26 px · lead 17→20 px · body 16 px · label 11.5 px (uppercase, 0.08 em) · mono 11 px.
Headings use weight 440 and −0.045/−0.055 em tracking, matching the reference's 450 weight and tight spacing.

## Grid & spacing

- Container: `max-width 1640px`, gutter `clamp(20px, 3.9vw, 56px)` → 56 px at 1440 (same as reference).
- Story sections: 2 columns (0.9fr text / 1.1fr visual) on desktop; on ≤ 900 px the visual moves above the text inside the sticky stage.
- Pricing: category intro (0.75fr, sticky) + rows (1.6fr); rows = name/desc · timeline · price · Discuss.
- Radius scale: 10 / 16 / 24 / pill. Cards use 16; paper cards 6–8 (sharper, like paper).

## Responsive behaviour

| Width | Behaviour |
|---|---|
| > 1150 | Full header nav with directory panels |
| ≤ 1150 | Hamburger → full-screen drawer with numbered links and disclosures |
| ≤ 1024 | Two-column layouts stack (hero side cards, FAQ, explore, next step) |
| ≤ 900 | Stories: visual above text, smaller headings, tabs across full width |
| ≤ 850 | Header 68 px |
| ≤ 760 | Price rows reflow to two lines; footer to two columns; hero bottom stacks |
| ≤ 600 | "Let's talk" → "Talk" |

Verified with no horizontal overflow (and no clipped content) at 1440, 1280, 768, 390 and 360 px — `tests/e2e/responsive.spec.ts`.

## Deviations from the reference (deliberate)

1. Colour accent and paper tone changed (brand distinction; see above).
2. Light/dark theme toggle not implemented — dark only in v1.
3. Client sign-in, Products menu, Team section, social icons and payment-partner marks removed (no ONYQ equivalents).
4. "Let's talk" opens a multi-step brief form, not an AI assistant persona.
5. About page uses the shared topic template instead of the reference's bespoke animated intro.
