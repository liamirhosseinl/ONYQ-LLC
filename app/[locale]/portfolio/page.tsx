import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation.ts";
import { getContent, getCatalogueCopy } from "@/content/index.ts";
import { caseStudies } from "@/data/cases.ts";
import { getService } from "@/data/services.ts";
import { pageMetadata } from "@/lib/metadata.ts";
import { NextStep, PageHero } from "@/components/page/PageBlocks.tsx";
import { CommerceMock, InsightMock, MessagingMock } from "@/components/home/StoryVisuals.tsx";
import { CaseCard } from "@/components/work/CaseCard.tsx";
import { PriceTag } from "@/components/pricing/PriceTag.tsx";
import { SplitLines } from "@/components/motion/Split.tsx";
import { Spark } from "@/components/ui/Wordmark.tsx";
import { ArrowUpRight, Check } from "@/components/ui/icons.tsx";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { portfolioPage } = getContent(locale);
  return pageMetadata({ title: portfolioPage.meta.title, description: portfolioPage.meta.description, path: "/portfolio", locale });
}

export default async function PortfolioPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { portfolioPage, cases } = getContent(locale);
  const copy = getCatalogueCopy(locale).serviceCopy;
  const t = await getTranslations("common");
  const tp = await getTranslations("pages");
  const tw = await getTranslations("work");
  const tNav = await getTranslations("nav");

  return (
    <>
      <PageHero
        crumbs={[{ label: tp("home"), href: "/" }, { label: tNav("work") }]}
        label={tw("projectsCount", { count: caseStudies.length })}
        title={portfolioPage.title}
        lead={portfolioPage.lead}
      />

      <section className="section section--tight portfolio-cases" aria-label={portfolioPage.casesLabel}>
        <div className="wrap portfolio-cases__list">
          {caseStudies.map((c, i) => (
            <div key={c.slug} data-reveal="up">
              <CaseCard
                study={c}
                copy={cases[c.slug]}
                index={i}
                total={caseStudies.length}
                locale={locale}
                labels={{ view: tw("view"), nda: tw("nda") }}
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="section concepts-section" aria-labelledby="concepts-title">
        <div className="wrap">
          <div className="concepts-section__head">
            <p className="eyebrow eyebrow--muted" data-reveal="up">
              <Spark className="eyebrow__spark" />
              {portfolioPage.conceptsLabel}
            </p>
            <h2 id="concepts-title" className="t-h2">
              <SplitLines lines={portfolioPage.conceptsTitle} />
            </h2>
            <p className="t-lead" data-reveal="up">
              {portfolioPage.conceptsLead}
            </p>
            <p className="notice" role="note" data-reveal="up">
              {portfolioPage.notice}
            </p>
          </div>
          <div className="concepts">
            {portfolioPage.concepts.map((c, i) => (
              <article key={c.id} id={c.id} className="concept" aria-labelledby={`${c.id}-title`}>
                <div className="concept__text" data-reveal="up">
                  <span className="concept__label">
                    {String(i + 1).padStart(2, "0")} · {c.meta}
                  </span>
                  <h3 id={`${c.id}-title`} className="t-h2">
                    <SplitLines lines={c.title} />
                  </h3>
                  <p className="t-body">{c.problem}</p>
                  <p className="eyebrow eyebrow--muted">{tp("conceptShows")}</p>
                  <ul role="list" className="concept__list">
                    {c.shows.map((s) => (
                      <li key={s}>
                        <Check /> {s}
                      </li>
                    ))}
                  </ul>
                  <p className="eyebrow eyebrow--muted">{tp("servicesInvolved")}</p>
                  <ul role="list" className="concept__list">
                    {c.services.map((id) => (
                      <li key={id}>
                        <Link href={getService(id).detailPage} className="fit__alt">
                          <span>{copy[id].name}</span>
                          <PriceTag serviceId={id} size="s" showRenewal={false} />
                          <ArrowUpRight />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="concept__visual" aria-hidden="true" data-reveal="scale">
                  {c.kind === "commerce" ? (
                    <CommerceMock note={t("concept")} />
                  ) : c.kind === "messaging" ? (
                    <MessagingMock note={t("concept")} />
                  ) : (
                    <InsightMock note={t("concept")} />
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <NextStep title={tp("portfolioNextTitle")} body={tp("portfolioNextBody")} />
    </>
  );
}
