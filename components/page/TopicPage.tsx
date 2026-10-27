import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation.ts";
import { getContent } from "@/content/index.ts";
import type { TopicSlug } from "@/content/types.ts";
import { pageMetadata } from "@/lib/metadata.ts";
import { isVisible } from "@/lib/site-mode.ts";
import { SparkStone, KitShape } from "@/components/art/BrandArt.tsx";
import { Split } from "@/components/motion/Split.tsx";
import { ArrowUpRight } from "@/components/ui/icons.tsx";
import { ProposedTag } from "@/components/ui/Proposed.tsx";
import { ExploreDiscipline } from "./ExploreDiscipline.tsx";
import { Receipt } from "@/components/pricing/PricingClientBits.tsx";
import { NextStep, PageHero, ServiceCards } from "./PageBlocks.tsx";
import { ReelStrip } from "./ReelStrip.tsx";

const SHAPE: Record<TopicSlug, "stone" | "ring" | "half" | "arc" | "spark" | "constellation" | "tail"> = {
  design: "spark",
  development: "ring",
  ai: "constellation",
  "mobile-apps": "half",
  marketing: "arc",
  content: "spark",
  gamification: "spark",
  "business-analytics": "ring",
  "financial-consulting": "arc",
  about: "constellation",
  "how-we-work": "tail",
};

export function topicMetadata(slug: TopicSlug, locale: string): Metadata {
  const topic = getContent(locale).topics[slug];
  return pageMetadata({ title: topic.meta.title, description: topic.meta.description, path: `/${slug}`, locale });
}

export async function TopicPage({ slug }: { slug: TopicSlug }) {
  const locale = await getLocale();
  const { topics } = getContent(locale);
  const topic = topics[slug];
  const tNav = await getTranslations("nav");
  const tp = await getTranslations("pages");
  const principles = topic.principles.filter(isVisible);
  const isDirection = slug !== "about" && slug !== "how-we-work";

  return (
    <>
      <PageHero
        eyebrow={isDirection ? `ONYQ / ${topic.index}` : "ONYQ"}
        label={topic.label}
        title={topic.title}
        lead={topic.lead}
        side={isDirection && topic.services.length > 0 ? <Receipt ids={topic.services.slice(0, 5)} title={tp("startingPrices", { label: topic.label })} /> : undefined}
        crumbs={
          isDirection
            ? [
                { label: tp("home"), href: "/" },
                { label: tNav("services"), href: "/services" },
                { label: topic.label },
              ]
            : [{ label: tp("home"), href: "/" }, { label: topic.label }]
        }
      />

      <section className="section section--tight" aria-label={topic.approach.kicker}>
        <div className="wrap">
          <ExploreDiscipline
            kicker={topic.approach.kicker}
            flow={topic.approach.flow}
            labels={topic.approach.labels}
            areas={topic.areas}
            exploreLabel={isDirection ? tp("exploreDiscipline") : tp("explore")}
            caption={tp("approachCaption")}
            panelLabel={tp("whatWeDo")}
            art={
              <>
                <SparkStone id={`topic-${slug}`} className="explore__stone" />
                <KitShape shape={SHAPE[slug]} className="explore__kit" />
              </>
            }
          />
        </div>
      </section>

      <section className="section inside" aria-labelledby="inside-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="inside-title" className="t-h3">
              <Split text={tp("whatsInside")} />
            </h2>
            <span className="mono">{tp("directionsCount", { count: topic.areas.length })}</span>
          </div>
          <ol role="list" className="inside__list" data-reveal-stagger>
            {topic.areas.map((a, i) => (
              <li key={a.title} className="inside__row">
                <span className="inside__num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="t-h3">{a.title}</h3>
                <p className="t-body">{a.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {slug === "content" ? <ReelStrip /> : null}

      <ServiceCards ids={topic.services} title={isDirection ? tp("servicesInArea") : tp("whereToStart")} />

      <section className="section statement" aria-labelledby="statement-title">
        <div className="wrap">
          <h2 id="statement-title" className="t-h2 statement__text">
            <Split text={topic.statement} />
          </h2>
          <ul role="list" className="statement__list" data-reveal-stagger>
            {principles.map((p) => (
              <li key={p.title}>
                <p className="t-h4">{p.title}</p>
                <p className="t-small">{p.body}</p>
                {p.approval === "proposed" ? <ProposedTag /> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section where-next" aria-labelledby="where-next-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="where-next-title" className="t-h3">
              <Split text={tp("whereNext")} />
            </h2>
            <Link href="/about" className="link-arrow">
              {tNav("items.about")} <ArrowUpRight />
            </Link>
          </div>
          <ul role="list" className="where-next__list" data-reveal-stagger>
            {topic.related.map((r) => {
              const rel = topics[r];
              return (
                <li key={r}>
                  <Link href={`/${r}`}>
                    <span className="num">{rel.index}</span>
                    <span className="t-h4">{rel.label}</span>
                    <span className="t-small">{rel.lead}</span>
                    <ArrowUpRight size={18} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <NextStep title={topic.next.title} body={topic.next.body} />
    </>
  );
}
