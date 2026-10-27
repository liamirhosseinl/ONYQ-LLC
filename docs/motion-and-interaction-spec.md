# Motion and interaction spec

**Engine (v2):** GSAP 3.15 + ScrollTrigger, Lenis 1.3.26 smooth scrolling (wheel / fine pointers only; native scrolling on touch and in automated browsers), CSS transitions driven by an IntersectionObserver. See the v2 section at the end; the table below covers the v1 interactions that are still in place.

**Safety contract (`components/motion/*`):** an inline `beforeInteractive` script sets `<html data-motion="full">` before paint only when `prefers-reduced-motion` is not `reduce`. Pinned layouts are keyed to that attribute. If the client bundle hasn't started 2.5 s after `load` (or 15 s at most), the attribute is removed and every story falls back to plain, readable flow. Without JS or with reduced motion, nothing is pinned and nothing is hidden.

Legend — **O**: observed on the reference; **E**: estimated from playback; **I**: ONYQ implementation choice.

| Element | Trigger | Start → end | Timing | Reverse / mobile / reduced motion |
|---|---|---|---|---|
| Header material | scroll > 8 px | transparent → 86 % page colour + 14 px blur + hairline | 320 ms (O: header uses .32 s cubic-bezier(.22,1,.36,1)) | Reverses at top. Same on mobile. |
| Header hide/show | scroll direction (> 6 px delta, past 160 px) | `translateY(0)` ↔ `-100%` | 320 ms ease-out (O) | Disabled while a menu is open. Reduced motion: no transition. |
| Directory menu | click (all), hover-intent 90 ms (fine pointers) | hidden → panel fade/slide 6 px | 220 ms (O) | Esc closes and returns focus; click outside closes; route change closes. |
| Mobile drawer | hamburger | hidden → full screen, fade/slide 12 px | 280 ms (I) | Esc / close button; focus trapped; body scroll locked; page behind inert. |
| Hero load | page load | letters: y 38 % + blur 18 px + opacity 0 → rest, stagger 90 ms; onyx slice: y 70 px, scale .94 → 1; core glow fades in; copy rises 18 px | 1.5 s / 1.8 s / 2.2 s, `expo.out` (E) | Runs once. Reduced motion: static. |
| Hero recede | scroll through 165 svh section | `--hp` 0 → 1: scene scale 1 → 1.08, darken to 85 %, wordmark fades/lifts, copy fades | scrubbed (O pattern, E values) | Reverses on scroll up. Mobile identical. Reduced motion: 100 svh static hero. |
| Scroll stories (×5) | scroll through `n × 100svh + 40svh` | `data-stage` 0→n-1 from progress; `--p` drives tab progress bars | Panels: opacity 480–620 ms + y 26 px 700–800 ms ease-out (E) | Fully reversible. Tabs scroll to the middle of their stage (smooth). Mobile: visual above text, smaller type. Reduced motion / no JS: all panels in normal flow. |
| Story 01 plates | stage change | tight iso stack → exploded with routed path drawing → flattens into the product card | 1.0–1.4 s ease-out (E) | |
| Concept / capability / process visuals | stage change | crossfade + 24 px rise + scale .97 → 1 | 600 / 900 ms (E) | |
| Transformation store | stage change | dated site → redesigned site → site scales to .72 with 6 traffic sources popping in (70 ms stagger) and an order toast | 600–900 ms (E) | |
| Value comparison | click / Enter / Space / ← → | Separate (3 tilted cards, dashed lines, "You 3") ↔ ONYQ (cards align, hub appears, solid path, "You 1"); rows strike-through ↔ check | 300–700 ms (I) | Keyboard and touch supported; caption announced via `aria-live`. |
| Letter composer | option change | line types in with a stepped clip-path; dot fills when a line is complete | 800 ms steps(24) (I) | "Clear the letter" resets. |
| Brief dialog | any "Let's talk" / "Discuss" / "Start a brief" | full-screen panel fade/rise 12 px | 320 ms (I) | Esc closes and restores focus; focus trap; background inert. |
| Topic "Explore this discipline" | click / arrow keys / Home / End | tab selection swaps text; geode rotates | 900 ms (I) | WAI-ARIA tabs pattern. |
| FAQ accordion | click / Enter | `grid-template-rows 0fr → 1fr`, plus icon rotates 45° | 320 ms (I) | Closed panels are `inert`. Reduced motion: instant. |
| Buttons / links | hover / focus / press | arrow nudges 2 px ↗, background change, press scale .98 | 180–320 ms | Focus: 2 px iris outline, 4 px offset. |
| Currency toggle | click | all prices switch USD ↔ AMD; URL `?currency=amd` | instant | Persisted only in the URL (shareable, no storage). |

Performance notes: only `transform`, `opacity`, CSS custom properties and `clip-path` are animated; ScrollTrigger sets two CSS variables per frame; artwork is inline SVG (no image requests). Not tested on a throttled device profile in this environment — validate on a mid-range Android phone before launch.

## v2 motion system

Components declare intent with attributes; `components/motion/MotionDirector.tsx` binds them (including content mounted later).

| Attribute / component | Effect |
|---|---|
| `.split` (`<Split>`, `<SplitLines>`) | Masked word-by-word rise with a slight rotation, 42 ms stagger; inside pinned stories words leave upward when a stage ends |
| `data-reveal` = up · fade · scale · left · right · blur · clip | Enter-on-scroll; `clip` wipes images in from the bottom while they settle from 1.18× zoom |
| `data-reveal-stagger` | Children rise in sequence (70 ms) |
| `data-parallax`, `data-rotate`, `data-scale-in` | Scroll-scrubbed drift, rotation, and the case cover growing from 0.86× with rounding easing out |
| `data-count` | Numbers count up (2.2 s, expo) to the server-rendered value |
| `data-magnetic` | Buttons pull toward the pointer and spring back |
| `data-tilt` + `.spotlight` | 3-D tilt with a volt light following the pointer (cards, principles, estimate) |
| `data-cursor="label"` | Custom cursor grows into a volt disc with a label ("View", "Next") |
| Intro curtain | First visit per session: forest curtain, spark mark spins in, counter, curtain lifts; then the hero stone, spark and flare assemble and the headline rises |
| Route curtain | `app/[locale]/template.tsx` — short wipe between pages |
| Hero | Pointer parallax on the stone/rings/stars; scroll scrub recedes the scene |
| Work stack | Case cards stack and scale back as the next one arrives |
| Marquees | Speed follows scroll velocity (`--velocity` skew) |
| Theme toggle | View Transitions circle reveal from the button |

Reduced motion or JS failure: `data-motion` is never set (or the watchdog removes it), so nothing is hidden, nothing is pinned, Lenis and the cursor stay off.
