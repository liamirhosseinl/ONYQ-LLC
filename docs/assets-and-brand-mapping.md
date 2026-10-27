# Assets and brand mapping

**Status: PROVISIONAL.** ONYQ has not supplied logo files or a Brand Book (owner decision, 18 Oct 2026: "build a provisional version"). Everything below is a placeholder system designed to be swapped without touching component code.

## Identity placeholders

| Asset | Current | File | Replace with |
|---|---|---|---|
| Wordmark | Text "onyq." in Geologica 600 with sharpness axis 100, iris full stop | `components/ui/Wordmark.tsx` (`data-provisional`) | Official SVG logo (header, footer, drawer, brief dialog all use this one component) |
| Favicon | Onyx slice motif with a Q tail | `app/icon.svg` | Official icon (also add `apple-icon.png`) |
| Colour tokens | Onyx / graphite / bone / ash / iris / chalcedony | `styles/tokens.css` | Brand Book colours — components use role names only |
| Typefaces | Geologica (display + UI), Geist Mono (micro labels) | `app/fonts.ts`, `app/fonts/*.woff2` | Brand Book typefaces |
| Tagline | "Clear ideas, built solid." | `data/site-config.ts → tagline` and `content/en/home.ts` | Approved tagline |
| Open Graph image | not set | — | Add `app/opengraph-image.png` once the logo exists |

## Artwork inventory (all original, generated in code)

| Visual | Where | How it is made | Rights |
|---|---|---|---|
| Onyx slice ("geode") with glowing core | Hero, footer, next-step panels, direction cards, 404, story card | Seeded SVG generator `components/art/geode.ts` + `GeodeSlice.tsx` | Created for ONYQ in this build |
| Night ridges, stars, water | Hero, horizon panels | SVG paths from `ridgePath()` + CSS gradients | Same |
| Contour lines + outlined ARMENIA | Origin section | `contourPaths()` | Same |
| Grain | Hero, horizon, origin | Inline SVG `feTurbulence` data URI | Same |
| Story plates, canvas, board, concept mocks, store mock | Homepage stories, portfolio | HTML/CSS/SVG drawn in components | Same; all businesses and numbers fictional and labelled |

No photography, stock imagery, icon packs or third-party illustrations are used. No reference-site asset is loaded or hotlinked (asserted by `tests/e2e/routes.spec.ts`).

## Fonts and licences

| Font | Source | Licence | File |
|---|---|---|---|
| Geologica (variable, wght + SHRP), Latin subset | `@fontsource-variable/geologica` 5.3.0 | SIL OFL 1.1 | `app/fonts/geologica-latin-shrp.woff2`, `OFL-Geologica.txt` |
| Geist Mono (variable), Latin subset | `@fontsource-variable/geist-mono` 5.3.0 | SIL OFL 1.1 | `app/fonts/geist-mono-latin.woff2`, `OFL-GeistMono.txt` |

Self-hosted through `next/font/local` (no Google Fonts request at runtime). When RU/HY are enabled, add the Cyrillic subset of both fonts and an Armenian face (e.g. Noto Sans Armenian, OFL).

## Deliberate deviations from the reference

| Reference | ONYQ | Reason |
|---|---|---|
| Warm orange accent, warm paper | Cool iris accent, cool paper | Avoid confusion with a competitor in the same market |
| Night landscape photo with glowing orb on a stone block | Code-drawn onyx slice over water | Original ONYQ motif; no reuse of their artwork |
| Founders' photos | Working principles | No approved people |
| Client project imagery | Labelled concept mocks | No approved case studies |
| Payment-partner logos, tax ID, legal links in footer | Omitted until approved | Brief §11.2 |

## When the Brand Book arrives

1. Replace values in `styles/tokens.css` (keep the variable names).
2. Swap `Wordmark.tsx` contents for the logo SVG; replace `app/icon.svg`.
3. Swap fonts in `app/fonts.ts` (or keep Geologica if approved).
4. If the brand has its own motif, replace `GeodeSlice` usages (5 places) — layout does not depend on it.
5. Remove "PROVISIONAL" notes here and in `tokens.css`; set `tagline.status` to `approved`.

## v2 — brand book applied

- Logo: the brand-book lockup (stone + spark mark + MG12 wordmark) is drawn as outlined SVG paths (`components/ui/brand-geometry.ts`); the MG12 font itself is not shipped. Favicon `app/icon.svg`: volt square with the forest mark.
- Colours: forest #14332F, field #516559, cloud #EEEEE9, gray #424242, volt #D4FF3A (the "one bright spark"), ember #FF5B2E, with their scales in `styles/tokens.css`. Day theme uses forest text on cloud, with volt as a highlighter; night theme uses cloud on forest.
- Typography: lowercase display headings as in the brand book; Armenian gets looser tracking.
- Art: spark-stone, rings and constellation (`components/art/BrandArt.tsx`) built from the brand book's shape kit; the v1 geode/horizon art was removed.
- Portfolio images are the owner's own files (`portfolio/`), converted to WebP.
