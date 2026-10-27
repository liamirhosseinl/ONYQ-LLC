# Adding a portfolio project

The portfolio is data-driven: one entry in `data/cases.ts` + copy in three languages + images.
The case page (`/portfolio/<slug>`), the portfolio list, the home "Selected work" stack, the
"Next project" link and the sitemap all pick a new entry up automatically.

## 1. What ONYQ supplies per project (same format as the first three)

A folder `portfolio/NN-name/` containing the images and an `info.txt` with:

| Field | Used for |
|---|---|
| Project name, year, industry | Hero, facts list |
| Client name + `show_client` yes/no | Shown only when yes; otherwise "Client under NDA" |
| `show_logo` yes/no | Whether logo artwork may appear in the gallery |
| Website URL (optional) | "Website" link on the case page |
| Services used | Linked to the catalogue's service pages and prices |
| Challenge, approach, scope, result | The case story |
| A measurable result (optional) | Animated number in the result band; must be real |
| Testimonial (optional) | Only if it is a real quote the client approved |
| Brand colours (optional) | Palette block and the page's accent colour |

info.txt can be in Persian; it is translated to EN, RU and HY.

## 2. Steps

1. Images: `python3 scripts/prepare-case-images.py "portfolio/04-name" <slug>`.
   This writes 2000 px WebP files to `public/work/<slug>/` and prints the `img(...)` lines.
2. `data/cases.ts`: add an entry (slug, year, client or `null`, url, services, accent colours,
   palette, metric, cover, gallery). Gallery `span` is `full` or `half`; put half images in pairs.
3. `content/en/cases.ts`, `content/ru/cases.ts`, `content/hy/cases.ts`: add name, industry,
   teaser, summary, challenge, approach, scope, result, metricLabel, tags and an alt text for
   every image key.
4. Check: `npm run typecheck && npm test` (the tests fail if an image file, an alt text or a
   translation is missing, or if a project under NDA shows its client name).

Rules that never change: no invented results, no invented testimonials, no client names or
logos without permission.
