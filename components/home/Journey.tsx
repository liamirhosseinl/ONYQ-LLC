import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Spark } from "@/components/ui/Wordmark.tsx";
import { STONE, SPARK } from "@/components/ui/brand-geometry.ts";

/**
 * "How an idea comes alive" — six crafted scenes (idea → research → design → develop →
 * system → product). Each scene is a small, believable piece of the real work: a kick-off
 * notebook, a research board, a design file, an editor with a build log, a system map and
 * the live product. The active scene follows the parent .story[data-stage] (styles/journey.css);
 * everything renders on the server. Visible text is localised (messages → mocks.journey).
 */
export async function Journey() {
  const t = await getTranslations("mocks.journey");
  const stickies = t.raw("idea.stickies") as string[];
  const quotes = t.raw("research.quotes") as string[];
  const bars = t.raw("research.bars") as string[];
  const layers = t.raw("design.layers") as string[];
  const nodes = t.raw("system.nodes") as string[];

  return (
    <div className="journey" aria-hidden="true">
      {/* 01 — Idea */}
      <div className="journey__scene journey__scene--idea">
        <div className="jx-window jx-notebook">
          <div className="jx-bar">
            <i />
            <i />
            <i />
            <span>{t("idea.file")}</span>
          </div>
          <div className="jx-notebook__paper">
            <p className="jx-notebook__date mono">01 —</p>
            <p className="jx-hand">{t("idea.note")}</p>
            <svg className="jx-sketch" viewBox="0 0 260 200" fill="none">
              <rect className="jx-draw" pathLength={1} x="20" y="14" width="96" height="172" rx="16" />
              <path className="jx-draw" pathLength={1} d="M36 46h64M36 60h40" />
              <rect className="jx-draw" pathLength={1} x="36" y="78" width="64" height="44" rx="6" />
              <path className="jx-draw" pathLength={1} d="M36 136h28M72 136h28M36 150h28M72 150h28" />
              <rect className="jx-draw jx-draw--accent" pathLength={1} x="36" y="164" width="64" height="12" rx="6" />
              <path className="jx-draw jx-draw--arrow" pathLength={1} d="M126 168c34 6 60-10 78-40m0 0l-14 4m14-4l2 14" />
              <path className="jx-draw" pathLength={1} d="M150 40c10-12 30-12 40 0M160 30l4 -10M180 30l-4 -10" />
            </svg>
            <span className="jx-tap" style={{ "--x": "27%", "--y": "84%" } as CSSProperties} />
            {stickies.map((s, i) => (
              <span key={s} className={`jx-sticky jx-sticky--${i + 1}`}>
                {s}
              </span>
            ))}
            <span className="jx-bulb">
              <Spark />
            </span>
          </div>
        </div>
      </div>

      {/* 02 — Research */}
      <div className="journey__scene journey__scene--research">
        <div className="jx-window jx-research">
          <div className="jx-bar">
            <i />
            <i />
            <i />
            <span>{t("research.title")}</span>
            <em className="jx-tag">{t("research.tag")}</em>
          </div>
          <div className="jx-research__body">
            <ul className="jx-quotes">
              {quotes.map((q, i) => (
                <li key={q} style={{ "--k": i } as CSSProperties}>
                  <span className={`jx-avatar jx-avatar--${i + 1}`}>{["A", "M", "S"][i]}</span>
                  <p>{q}</p>
                </li>
              ))}
            </ul>
            <div className="jx-needs">
              <p className="jx-needs__title">{t("research.needs")}</p>
              {bars.map((b, i) => (
                <div key={b} className="jx-needs__row" style={{ "--v": [0.92, 0.78, 0.71][i], "--k": i } as CSSProperties}>
                  <span>{b}</span>
                  <span className="jx-needs__track">
                    <span />
                  </span>
                </div>
              ))}
              <svg className="jx-needs__dots" viewBox="0 0 200 70">
                {Array.from({ length: 22 }, (_, i) => (
                  <circle key={i} cx={10 + (i % 11) * 18} cy={18 + Math.floor(i / 11) * 30} r={i === 6 || i === 15 ? 6 : 4} className={i === 6 || i === 15 ? "on" : undefined} style={{ "--k": i } as CSSProperties} />
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 03 — Design */}
      <div className="journey__scene journey__scene--design">
        <div className="jx-window jx-design">
          <div className="jx-bar">
            <i />
            <i />
            <i />
            <span>{t("design.file")}</span>
          </div>
          <div className="jx-design__body">
            <ul className="jx-layers">
              {layers.map((l, i) => (
                <li key={l} data-on={i === 3 ? "true" : undefined}>
                  <span className="jx-layers__icon" />
                  {l}
                </li>
              ))}
            </ul>
            <div className="jx-artboard">
              <div className="jx-screen">
                <div className="jx-screen__status">
                  <span>9:41</span>
                  <span className="jx-screen__icons" />
                </div>
                <div className="jx-screen__hero">
                  <span className="jx-screen__plate" />
                </div>
                <p className="jx-screen__title">{t("design.hero")}</p>
                <p className="jx-screen__sub">{t("design.sub")}</p>
                <div className="jx-screen__chips">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="jx-screen__cta">
                  {t("design.cta")}
                  <span className="jx-select" />
                </span>
              </div>
              <span className="jx-cursor">
                <svg viewBox="0 0 16 16">
                  <path d="M2 1.5 14 7l-5.2 1.6L6.6 14z" />
                </svg>
                <em>{t("design.cursor")}</em>
              </span>
              <span className="jx-guide jx-guide--v" />
              <span className="jx-guide jx-guide--h" />
            </div>
            <div className="jx-inspector">
              <p>{t("design.inspector")}</p>
              <div className="jx-swatches">
                {["#14332f", "#d4ff3a", "#eeeee9", "#ff5b2e"].map((c) => (
                  <span key={c} style={{ "--c": c } as CSSProperties}>
                    <i />
                    {c}
                  </span>
                ))}
              </div>
              <p>{t("design.type")}</p>
              <div className="jx-type">
                <strong>Aa</strong>
                <span>Inter Tight · 32 / 36</span>
              </div>
              <div className="jx-radius">
                <span>R</span>
                <b>14</b>
                <span>↔</span>
                <b>24</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 04 — Develop */}
      <div className="journey__scene journey__scene--develop">
        <div className="jx-window jx-editor">
          <div className="jx-bar jx-bar--tabs">
            <i />
            <i />
            <i />
            <span className="jx-tab is-on">booking.ts</span>
            <span className="jx-tab">slots.ts</span>
          </div>
          <div className="jx-code">
            {CODE.map((line, i) => (
              <p key={i} style={{ "--k": i } as CSSProperties}>
                <span className="jx-ln">{i + 1}</span>
                <span className="jx-src" dangerouslySetInnerHTML={{ __html: line || "&nbsp;" }} />
              </p>
            ))}
          </div>
          <div className="jx-term">
            <p>
              <span className="jx-prompt">$</span> npm run build && npm test
            </p>
            <p className="ok">✓ {t("develop.build")} · 1.8s</p>
            <p className="ok">✓ 42 {t("develop.tests")}</p>
            <p className="accent">▲ {t("develop.deploy")} · onyq.am</p>
          </div>
          <div className="jx-score">
            <svg viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" />
              <circle className="jx-score__arc" cx="22" cy="22" r="18" pathLength={100} />
            </svg>
            <b>98</b>
            <span>{t("develop.score")}</span>
          </div>
        </div>
      </div>

      {/* 05 — System */}
      <div className="journey__scene journey__scene--system">
        <div className="jx-system">
          <svg className="jx-system__wires" viewBox="0 0 600 420" preserveAspectRatio="none">
            {NODE_POS.map(([x, y], i) => (
              <g key={i} style={{ "--k": i } as CSSProperties}>
                <path className="jx-wire" d={`M300 210 C ${(300 + x) / 2} 210, ${(300 + x) / 2} ${y}, ${x} ${y}`} />
                <path className="jx-flow" pathLength={100} d={`M300 210 C ${(300 + x) / 2} 210, ${(300 + x) / 2} ${y}, ${x} ${y}`} />
              </g>
            ))}
          </svg>
          <div className="jx-hub">
            <svg viewBox="0 0 100 100">
              <path fillRule="evenodd" d={STONE} className="jx-hub__stone" />
              <path d={SPARK} className="jx-hub__spark" />
            </svg>
            <span>{t("system.hub")}</span>
          </div>
          {nodes.map((n, i) => (
            <span
              key={n}
              className="jx-node"
              style={{ left: `${(NODE_POS[i][0] / 600) * 100}%`, top: `${(NODE_POS[i][1] / 420) * 100}%`, "--k": i } as CSSProperties}
            >
              <i className={`jx-node__icon jx-node__icon--${i}`} />
              {n}
              <em className="jx-node__pulse" />
            </span>
          ))}
        </div>
      </div>

      {/* 06 — Product */}
      <div className="journey__scene journey__scene--product">
        <div className="jx-product">
          <div className="jx-phone">
            <div className="jx-phone__notch" />
            <div className="jx-phone__screen">
              <p className="jx-phone__day">{t("product.today")}</p>
              <div className="jx-phone__card">
                <span className="jx-phone__pic" />
                <div>
                  <b>{t("design.hero")}</b>
                  <small>{t("product.booked")}</small>
                </div>
              </div>
              <div className="jx-phone__chart">
                <svg viewBox="0 0 160 60" preserveAspectRatio="none">
                  <path className="jx-area" d="M0 52 C20 48 30 40 50 42 S80 26 100 28 S135 10 160 8 V60 H0Z" />
                  <path className="jx-line" pathLength={1} d="M0 52 C20 48 30 40 50 42 S80 26 100 28 S135 10 160 8" />
                </svg>
                <div className="jx-phone__legend">
                  <span>{t("product.visits")}</span>
                  <span>{t("product.orders")}</span>
                </div>
              </div>
              <span className="jx-phone__btn">{t("design.cta")}</span>
            </div>
          </div>
          <ul className="jx-toasts">
            <li style={{ "--k": 0 } as CSSProperties}>
              <i className="jx-toasts__dot" />
              {t("product.order")}
              <b>$48</b>
            </li>
            <li style={{ "--k": 1 } as CSSProperties}>
              <i className="jx-toasts__dot jx-toasts__dot--star">★</i>
              {t("product.review")}
            </li>
            <li style={{ "--k": 2 } as CSSProperties}>
              <i className="jx-toasts__dot jx-toasts__dot--cal" />
              {t("product.booked")}
            </li>
          </ul>
          <span className="jx-live">
            <i />
            {t("product.live")}
          </span>
        </div>
      </div>
    </div>
  );
}

const NODE_POS: [number, number][] = [
  [92, 70],
  [508, 64],
  [560, 214],
  [500, 356],
  [100, 352],
  [44, 212],
];

const k = (s: string) => `<span class="k">${s}</span>`;
const f = (s: string) => `<span class="f">${s}</span>`;
const s = (x: string) => `<span class="s">${x}</span>`;
const c = (x: string) => `<span class="c">${x}</span>`;
const CODE = [
  `${k("export async function")} ${f("bookTable")}(req) {`,
  `  ${k("const")} { guests, time } = ${f("parse")}(req)`,
  `  ${k("const")} slot = ${k("await")} slots.${f("find")}(time, guests)`,
  `  ${k("if")} (!slot) ${k("return")} ${f("suggest")}(time)`,
  "",
  `  ${k("await")} payments.${f("hold")}(slot.deposit)`,
  `  ${k("await")} crm.${f("upsert")}(req.customer)`,
  `  ${k("await")} bot.${f("notify")}(${s("'New booking'")}, slot)`,
  `  ${c("// confirmation in under a second")}`,
  `  ${k("return")} { ok: ${k("true")}, slot }`,
  "}",
];
