# Homepage section map — reference vs ONYQ

Heights measured on the reference at 1440 × 900 (scroll height ≈ 24,500 px). "Pinned" = tall section with a `position: sticky` stage; progress drives the stage.

| # | Reference (observed) | Height | ONYQ implementation | Retained / replaced |
|---|---|---|---|---|
| 0 | Header over hero | 80 px fixed | `SiteHeader` | Retained (no theme toggle, sign-in, products) |
| 1 | **Opening**: sticky panorama, huge spaced wordmark A R E V I A N, night landscape + glowing orb on a stone; tagline "Ideas deserve their own light." + short intro + social icons. On scroll the scene recedes into a band. | 1,800 px (2 vh) | `Hero` + `HeroMotion`: spaced O N Y Q wordmark, code-drawn night ridges and water, a polished **onyx slice** with a glowing core in front of the wordmark; tagline + lead + "Start a brief" / "See pricing". Load sequence + scroll recede (scale/dim). | Composition retained; all artwork, copy and the object replaced |
| 2 | **01 / How an idea comes alive** — 3 stages Feel / Build / Bring to life; headline swaps ("First comes feeling." → "Then comes precision." → "An idea becomes real."); isometric layered plates morphing into a product card; tabs with progress lines; "Scroll to unfold the story". | 3,060 px (3.4 vh) | `ScrollStory#studio`: Shape / System / Launch; plates (idea sketch → routed system grid → product card) | Pattern retained; copy and visual original |
| 3 | **02 / Ideas in action** — their 3 client projects, big outlined numbers, project cards | 3,060 px | `ScrollStory#work`: 3 **concept studies** (online store, Telegram booking mini app, retail dashboard), each tagged "Illustrative concepts — not client projects" | Client work removed (brief §1.2) |
| 4 | **03 / What we do** — Design / Engineering / Intelligence with canvas visual | 3,060 px | `ScrollStory#approach`: same three disciplines, ONYQ canvas (type specimen, module graph, sourced-answer chat) | Retained, original |
| 5 | **04 / Our own practice** — their products (Launch, Ari, Pulse) | 3,060 px | `ScrollStory#process`: **How a project runs** — Brief / Build / Launch (brief doc, build board, launch monitor) | Products replaced with process (brief §4.6) |
| 6 | **05 / The economics of common sense** — toggle Separate contractors / One team; node diagram with "You 3 → 1"; 3 before→after rows; disclaimer | 1,044 px | `ValueComparison`: same interaction, qualitative claims only, disclaimer kept | Retained |
| 7 | **06 / A new site. New possibilities.** — Before / After / In business with a demo store ("LUMA"), traffic sources, order notification | 2,880 px | `ScrollStory#transformation` with a fictional "clay & kiln" store, labelled "A study using a fictional store" | Retained, demo replaced and labelled |
| 8 | **Where we come from** — ARMENIA over a photo; "Armenian roots. An open horizon." | 1,067 px | `Origin`: outlined ARMENIA over code-drawn contour lines; "Registered in Armenia." + factual body | Claims limited to registration |
| 9 | **People behind** — two founders with photos | 1,334 px | `Principles`: four working rules (one flagged "proposed") | Founders removed (no approved profiles) |
| 10 | **Now comes your story** — letter with 3 lines (challenge / solution / first step), auto-typing, "Replay", "Let's write our story" | 2,491 px | `LetterSection` + `LetterComposer`: three real choices write the letter live; "Continue this letter" opens the brief with answers kept | Concept retained, made functional |
| 11 | **One partner. Your whole digital business.** — giant two-line statement, 4 direction links, CTA | 1,222 px | `PromiseSection` | Retained, original copy |
| 12 | Footer — "Always in touch." over artwork, contacts, columns | — | `SiteFooter` with `Horizon` art; only configured contacts appear | Contacts/legal/payment marks removed |

ONYQ homepage scroll height at 1440 × 900: ≈ 23,200 px (comparable rhythm).
