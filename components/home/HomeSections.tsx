import { getTranslations } from "next-intl/server";
import type { HomeContent } from "@/content/types.ts";
import { Link } from "@/i18n/navigation.ts";
import { OpenBriefButton } from "@/components/brief/OpenBriefButton.tsx";
import { ArrowUpRight } from "@/components/ui/icons.tsx";
import { ProposedTag } from "@/components/ui/Proposed.tsx";
import { Constellation, KitShape, Rings } from "@/components/art/BrandArt.tsx";
import { Split, SplitLines } from "@/components/motion/Split.tsx";
import { Spark } from "@/components/ui/Wordmark.tsx";
import { isVisible } from "@/lib/site-mode.ts";
import { LetterComposer } from "./LetterComposer.tsx";
import { formatNumber } from "@/lib/format.ts";

export function Origin({ copy }: { copy: HomeContent["origin"] }) {
  return (
    <section className="origin" aria-labelledby="origin-title">
      <div className="origin__art" aria-hidden="true">
        <div className="origin__rings" data-parallax="0.25">
          <Rings count={14} pulse />
        </div>
        <p className="origin__word" data-parallax="-0.2">
          {copy.word}
        </p>
        <Constellation count={16} seed={21} className="origin__stars" />
      </div>
      <div className="wrap origin__inner">
        <p className="eyebrow eyebrow--muted" data-reveal="up">
          <Spark className="eyebrow__spark" />
          {copy.label}
        </p>
        <h2 id="origin-title" className="t-h2">
          <SplitLines lines={copy.title} />
        </h2>
        <p className="t-lead" data-reveal="up" style={{ ["--reveal-delay" as string]: "200ms" }}>
          {copy.body}
        </p>
      </div>
    </section>
  );
}

const PRINCIPLE_SHAPES = ["stone", "ring", "arc", "constellation"] as const;

export async function Principles({ copy }: { copy: HomeContent["principles"] }) {
  const items = copy.items.filter((i) => isVisible(i));
  return (
    <section className="principles section" aria-labelledby="principles-title">
      <div className="wrap">
        <div className="principles__head">
          <p className="eyebrow eyebrow--muted" data-reveal="up">
            <Spark className="eyebrow__spark" />
            {copy.label}
          </p>
          <h2 id="principles-title" className="t-h1">
            <Split text={copy.title} />
          </h2>
        </div>
        <ul role="list" className="principles__list" data-reveal-stagger>
          {items.map((item, i) => (
            <li key={item.title} className="principle spotlight" data-tilt="5">
              <div className="principle__top">
                <span className="principle__num">{i + 1}</span>
                <KitShape shape={PRINCIPLE_SHAPES[i % PRINCIPLE_SHAPES.length]} className="principle__kit" />
              </div>
              <h3 className="t-h4">{item.title}</h3>
              <p className="t-body">{item.body}</p>
              {"approval" in item && item.approval === "proposed" ? <ProposedTag /> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export async function LetterSection() {
  const t = await getTranslations("letter");
  return (
    <section className="letter-section section" id="start" aria-labelledby="letter-title">
      <div className="wrap">
        <div className="letter-section__head">
          <p className="eyebrow eyebrow--muted" data-reveal="up">
            <Spark className="eyebrow__spark" />
            {t("eyebrow")}
          </p>
          <h2 id="letter-title" className="t-display">
            <SplitLines lines={[t("title1"), t("title2")]} />
          </h2>
          <p className="t-lead" data-reveal="up">
            {t("lead")}
          </p>
        </div>
        <div data-reveal="up">
          <LetterComposer />
        </div>
      </div>
    </section>
  );
}

export function PromiseSection({ copy }: { copy: HomeContent["promise"] }) {
  return (
    <section className="promise" aria-labelledby="promise-title">
      <div className="wrap">
        <div className="promise__top" data-reveal="fade">
          <p className="eyebrow">
            <Spark className="eyebrow__spark" />
            {copy.label}
          </p>
          <p className="mono">2026 →</p>
        </div>
        <h2 id="promise-title" className="t-giant promise__title">
          <SplitLines lines={copy.title} />
        </h2>
        <div className="promise__grid">
          <div data-reveal="up">
            <h3 className="t-h3">{copy.subtitle}</h3>
            <p className="t-lead">{copy.body}</p>
          </div>
          <ul role="list" className="promise__links" data-reveal-stagger>
            {copy.links.map((l, i) => (
              <li key={l.href}>
                <Link href={l.href}>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="promise__link-text">{l.label}</span>
                  <ArrowUpRight size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Stats({ copy, locale }: { copy: HomeContent["stats"]; locale: string }) {
  const fmt = { format: (n: number) => formatNumber(n, locale) };
  return (
    <section className="stats" aria-label={copy.label}>
      <div className="wrap">
        <ul role="list" className="stats__list" data-reveal-stagger>
          {copy.items.map((s) => (
            <li key={s.label} className="stat">
              <p className="stat__value">
                <span data-count={s.value} data-count-suffix={s.suffix}>
                  {fmt.format(s.value)}
                  {s.suffix}
                </span>
              </p>
              <p className="stat__label">{s.label}</p>
              <p className="stat__source">
                <Spark className="stat__spark" />
                {s.source}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
