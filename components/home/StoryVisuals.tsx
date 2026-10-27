import { getTranslations } from "next-intl/server";
import { SparkStone } from "@/components/art/BrandArt.tsx";
import { Spark } from "@/components/ui/Wordmark.tsx";

/* Original, code-drawn illustrations. Their state is driven purely by the parent
   .story[data-stage] attribute (styles/story.css), so they render on the server and need no
   client JavaScript of their own. All visible text is localised (messages → "mocks"). */

export async function CommerceMock({ note, step }: { note: string; step?: number }) {
  const t = await getTranslations("mocks");
  return (
    <div className="mock mock--commerce" data-mock={step}>
      <div className="mock__bar">
        <i />
        <i />
        <i />
        <span>clay-and-kiln / {t("shop.shop").toLowerCase()}</span>
      </div>
      <div className="shop">
        <div className="shop__nav">
          <strong>clay &amp; kiln</strong>
          <span>{t("shop.shop")}</span>
          <span>{t("shop.workshop")}</span>
          <span>{t("shop.delivery")}</span>
          <span className="shop__cart">{t("shop.cart", { n: 2 })}</span>
        </div>
        <div className="shop__hero">
          <p>
            {t("shop.hero1")}
            <br />
            {t("shop.hero2")}
          </p>
          <span className="shop__chip">{t("shop.chip")}</span>
        </div>
        <div className="shop__grid">
          {["bowl", "cup", "vase", "plate"].map((k) => (
            <div key={k} className={`shop__item shop__item--${k}`}>
              <span className="ceramic" />
              <span className="shop__price" />
            </div>
          ))}
        </div>
      </div>
      <span className="mock__tag">{note}</span>
    </div>
  );
}

export async function MessagingMock({ note, step }: { note: string; step?: number }) {
  const t = await getTranslations("mocks");
  const days = t.raw("phone.days") as string[];
  return (
    <div className="mock mock--messaging" data-mock={step}>
      <div className="phone">
        <div className="phone__head">
          <span className="phone__avatar" />
          <span>
            <strong>{t("phone.title")}</strong>
            <small>{t("phone.sub")}</small>
          </span>
        </div>
        <p className="phone__title">{t("phone.choose")}</p>
        <div className="phone__days">
          {days.map((d, i) => (
            <span key={d} data-on={i === 1 ? "true" : undefined}>
              {d}
            </span>
          ))}
        </div>
        <div className="phone__slots">
          {["09:00", "09:30", "10:30", "11:00", "12:30", "14:00"].map((s, i) => (
            <span key={s} data-on={i === 2 ? "true" : undefined} data-off={i === 3 ? "true" : undefined}>
              {s}
            </span>
          ))}
        </div>
        <span className="phone__btn">{t("phone.confirm")}</span>
        <span className="phone__toast">{t("phone.toast", { day: days[1], time: "10:30" })}</span>
      </div>
      <span className="mock__tag">{note}</span>
    </div>
  );
}

export async function InsightMock({ note, step }: { note: string; step?: number }) {
  const t = await getTranslations("mocks");
  return (
    <div className="mock mock--insight" data-mock={step}>
      <div className="mock__bar">
        <i />
        <i />
        <i />
        <span>{t("dash.bar")}</span>
      </div>
      <div className="dash">
        <div className="dash__kpis">
          <span>
            <small>{t("dash.orders")}</small>
            <b>412</b>
          </span>
          <span>
            <small>{t("dash.revenue")}</small>
            <b>+18%</b>
          </span>
          <span>
            <small>{t("dash.stock")}</small>
            <b>3</b>
          </span>
        </div>
        <svg className="dash__chart" viewBox="0 0 300 110" preserveAspectRatio="none">
          <path className="dash__area" d="M0 90 L30 80 L60 84 L90 64 L120 70 L150 50 L180 56 L210 38 L240 42 L270 24 L300 28 L300 110 L0 110 Z" />
          <path className="dash__line" d="M0 90 L30 80 L60 84 L90 64 L120 70 L150 50 L180 56 L210 38 L240 42 L270 24 L300 28" />
        </svg>
        <div className="dash__bars">
          {(
            [
              [t("dash.search"), 78],
              ["Instagram", 56],
              [t("dash.direct"), 34],
            ] as const
          ).map(([k, v]) => (
            <span key={k}>
              <small>{k}</small>
              <i style={{ width: `${v}%` }} />
            </span>
          ))}
        </div>
      </div>
      <span className="mock__tag">{note}</span>
    </div>
  );
}

export async function ProcessBoard() {
  const t = await getTranslations("mocks");
  const rows = t.raw("board.rows") as string[];
  const cols = t.raw("board.cols") as string[];
  const cards = t.raw("board.cards") as string[][];
  return (
    <div className="board" aria-hidden="true">
      <div className="board__panel board__panel--brief" data-proc="0">
        <div className="doc">
          <p className="doc__title">{t("board.brief")}</p>
          {rows.map((l, i) => (
            <p key={l} className="doc__row">
              <span className="doc__tick" data-done={i < 3 ? "true" : undefined} />
              {l}
            </p>
          ))}
          <div className="doc__foot">
            <span>{t("board.scope")}</span>
            <span>{t("board.timeline")}</span>
            <span>{t("board.price")}</span>
          </div>
        </div>
      </div>
      <div className="board__panel board__panel--build" data-proc="1">
        <div className="kanban">
          {cols.map((col, ci) => (
            <div key={col} className="kanban__col">
              <p>{col}</p>
              {(cards[ci] ?? []).map((c) => (
                <span key={c} className="kanban__card">
                  {c}
                </span>
              ))}
            </div>
          ))}
          <div className="kanban__progress">
            <i />
          </div>
        </div>
      </div>
      <div className="board__panel board__panel--launch" data-proc="2">
        <div className="monitor">
          <p className="monitor__head">
            <span className="monitor__dot" /> {t("board.live")}
            <span>{t("board.connected")}</span>
          </p>
          <svg viewBox="0 0 300 90" preserveAspectRatio="none" className="monitor__chart">
            <path d="M0 70 C40 66 60 72 90 58 S150 40 180 46 S240 22 300 18" />
          </svg>
          <div className="monitor__stats">
            <span>{t("board.uptime")}</span>
            <span>{t("board.backups")}</span>
            <span>{t("board.updates")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function StoreTransformation() {
  const t = await getTranslations("mocks");
  const sources = t.raw("store.sources") as string[];
  const oldNav = t.raw("store.oldNav") as string[];
  return (
    <div className="store" aria-hidden="true">
      <div className="store__browser">
        <div className="mock__bar">
          <i />
          <i />
          <i />
          <span>clay-and-kiln</span>
        </div>
        <div className="store__view store__view--before">
          <p className="old__title">{t("store.oldTitle")}</p>
          <p className="old__nav">
            {oldNav.map((n, i) => (
              <span key={n}>
                <u>{n}</u>
                {i < oldNav.length - 1 ? " | " : ""}
              </span>
            ))}
          </p>
          <div className="old__body">
            <div className="old__thumbs">
              <i />
              <i />
              <i />
            </div>
            <p>{t("store.oldBody")}</p>
            <p className="old__call">{t("store.oldCall")}</p>
          </div>
        </div>
        <div className="store__view store__view--after">
          <div className="new__nav">
            <strong>clay &amp; kiln</strong>
            <span>{t("shop.shop")}</span>
            <span>{t("shop.cart", { n: 1 })}</span>
          </div>
          <div className="new__hero">
            <div>
              <p className="new__kicker">{t("store.kicker")}</p>
              <p className="new__title">{t("shop.hero1")}</p>
              <p className="new__sub">{t("shop.hero2")}</p>
              <span className="new__btn">{t("store.button")}</span>
            </div>
            <span className="ceramic ceramic--hero" />
          </div>
        </div>
      </div>
      <div className="store__flow">
        {sources.map((s, i) => (
          <span key={s} className="store__source" style={{ ["--k" as string]: i }}>
            {s}
          </span>
        ))}
        <span className="store__order">{t("store.order")}</span>
        <span className="store__funnel">{t("store.funnel")}</span>
      </div>
    </div>
  );
}
