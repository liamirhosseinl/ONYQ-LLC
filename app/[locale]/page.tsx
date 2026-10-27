import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation.ts";
import { getContent } from "@/content/index.ts";
import { caseStudies } from "@/data/cases.ts";
import { pageMetadata } from "@/lib/metadata.ts";
import { ScrollStory } from "@/components/motion/ScrollStory.tsx";
import { Hero } from "@/components/home/Hero.tsx";
import { Journey } from "@/components/home/Journey.tsx";
import { Showcase } from "@/components/home/Showcase.tsx";
import { ProcessBoard, StoreTransformation } from "@/components/home/StoryVisuals.tsx";
import { ValueComparison } from "@/components/home/ValueComparison.tsx";
import { Origin, Principles, LetterSection, PromiseSection, Stats } from "@/components/home/HomeSections.tsx";
import { OpenBriefButton } from "@/components/brief/OpenBriefButton.tsx";
import { WorkAccordion } from "@/components/work/WorkAccordion.tsx";
import { formatNumber } from "@/lib/format.ts";
import { SplitLines } from "@/components/motion/Split.tsx";
import { Spark } from "@/components/ui/Wordmark.tsx";
import { ArrowUpRight } from "@/components/ui/icons.tsx";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { home } = getContent(locale);
  return { ...pageMetadata({ title: home.meta.title, description: home.meta.description, path: "/", locale }), title: { absolute: home.meta.title } };
}

function TwoLine({ lines, as: Tag = "h2", className = "t-display" }: { lines: string[]; as?: "h2" | "h3"; className?: string }) {
  return (
    <Tag className={className}>
      <SplitLines lines={lines} />
    </Tag>
  );
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { home, cases } = getContent(locale);
  const t = await getTranslations("common");
  const tw = await getTranslations("work");

  const s = home.story;
  const w = home.work;
  const cap = home.capabilities;
  const pr = home.process;
  const tr = home.transformation;

  return (
    <>
      <Hero copy={home.hero} marquee={home.hero.marquee} />

      <ScrollStory
        id="studio"
        label={s.label}
        className="story--studio"
        head={
          <div className="story__topline">
            <p className="eyebrow">
              <Spark className="eyebrow__spark" />
              {s.label}
            </p>
            <Link href="/services" className="link-arrow">
              {s.aside} <ArrowUpRight />
            </Link>
          </div>
        }
        panels={s.stages.map((st, i) => (
          <div key={st.key} className="story-text">
            <span className="num">{String(i + 1).padStart(2, "0")}</span>
            <TwoLine lines={st.title} />
            <p className="t-lead">{st.body}</p>
          </div>
        ))}
        visual={<Journey />}
        tabs={s.stages.map((st) => ({ key: st.key, label: st.tab }))}
        scrollHint={t("scrollHint")}
      />

      <section className="work-home section" aria-labelledby="work-title" id="work">
        <div className="wrap">
          <div className="work-home__head">
            <p className="eyebrow" data-reveal="up">
              <Spark className="eyebrow__spark" />
              {w.label}
            </p>
            <h2 id="work-title" className="t-display">
              <SplitLines lines={w.title} />
            </h2>
            <div className="work-home__side" data-reveal="up">
              <p className="t-lead">{w.lead}</p>
              <Link href="/portfolio" className="btn btn--ghost" data-magnetic="0.2">
                {w.all} <ArrowUpRight />
              </Link>
            </div>
          </div>
        </div>
        <WorkAccordion
          view={tw("view")}
          items={caseStudies.map((c) => {
            const cc = cases[c.slug];
            return {
              slug: c.slug,
              name: cc.name,
              industry: cc.industry,
              teaser: cc.teaser,
              tags: cc.tags,
              year: c.year,
              metric: c.metric ? `${c.metric.prefix ?? ""}${formatNumber(c.metric.value, locale)}${c.metric.suffix ?? ""}` : null,
              metricLabel: cc.metricLabel,
              accent: c.accent,
              cover: { src: (c.feature ?? c.cover).src, width: (c.feature ?? c.cover).width, height: (c.feature ?? c.cover).height, alt: cc.alts[(c.feature ?? c.cover).alt] ?? cc.name, cutout: (c.feature ?? c.cover).cutout },
            };
          })}
        />
      </section>

      <Stats copy={home.stats} locale={locale} />

      <ScrollStory
        id="approach"
        label={cap.label}
        className="story--approach"
        head={
          <div className="story__topline story__topline--split">
            <p className="eyebrow">
              <Spark className="eyebrow__spark" />
              {cap.label}
            </p>
            <h2 className="t-h2">
              <SplitLines lines={cap.title} toneSecond={false} />
            </h2>
          </div>
        }
        panels={cap.stages.map((st, i) => (
          <div key={st.key} className="story-text story-text--cap">
            <span className="story-text__num">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="t-h2">{st.title}</h3>
            <p className="t-body">{st.body}</p>
            <ul role="list" className="tags">
              {st.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <Link href={st.href} className="link-arrow">
              {st.link} <ArrowUpRight />
            </Link>
          </div>
        ))}
        visual={<Showcase />}
        tabs={cap.stages.map((st) => ({ key: st.key, label: st.tab }))}
        scrollHint={t("scrollHint")}
      />

      <ScrollStory
        id="process"
        label={pr.label}
        className="story--process"
        head={
          <div className="story__topline story__topline--split">
            <p className="eyebrow">
              <Spark className="eyebrow__spark" />
              {pr.label}
            </p>
            <TwoLine lines={pr.title} className="t-h2" />
          </div>
        }
        panels={pr.stages.map((st, i) => (
          <div key={st.key} className="story-text story-text--cap">
            <span className="story-text__num">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="t-h2">{st.title}</h3>
            <p className="t-body">{st.body}</p>
            {i === 0 ? (
              <OpenBriefButton className="link-arrow">
                {home.hero.primary} <ArrowUpRight />
              </OpenBriefButton>
            ) : (
              <Link href="/how-we-work" className="link-arrow">
                {t("explore")} <ArrowUpRight />
              </Link>
            )}
          </div>
        ))}
        visual={<ProcessBoard />}
        tabs={pr.stages.map((st) => ({ key: st.key, label: st.tab }))}
        scrollHint={t("scrollHint")}
      />

      <ValueComparison copy={home.value} />

      <ScrollStory
        id="transformation"
        label={tr.label}
        className="story--transformation"
        head={
          <div className="story__topline story__topline--stack">
            <div className="story__topline-row">
              <p className="eyebrow">
                <Spark className="eyebrow__spark" />
                {tr.label}
              </p>
              <p className="mono">{tr.note}</p>
            </div>
          </div>
        }
        panels={tr.stages.map((st, i) => (
          <div key={st.key} className="story-text">
            <p className="story-text__step">
              <span className="story-text__stepnum">{String(i + 1).padStart(2, "0")}</span>
              <span className="mono">/ 03 — {st.tab}</span>
            </p>
            <TwoLine lines={st.title} className="t-h2" as="h3" />
            <p className="t-body">{st.body}</p>
            <ul role="list" className="story-text__points">
              {st.points.map((p) => (
                <li key={p}>
                  <Spark className="story-text__spark" />
                  {p}
                </li>
              ))}
            </ul>
            {i === 2 ? (
              <OpenBriefButton className="link-arrow">
                {tr.cta} <ArrowUpRight />
              </OpenBriefButton>
            ) : null}
          </div>
        ))}
        visual={<StoreTransformation />}
        tabs={tr.stages.map((st) => ({ key: st.key, label: st.tab }))}
        scrollHint={t("scrollHint")}
      />

      <Origin copy={home.origin} />
      <Principles copy={home.principles} />
      <LetterSection />
      <PromiseSection copy={home.promise} />
    </>
  );
}
