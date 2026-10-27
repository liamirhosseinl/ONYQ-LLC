import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation.ts";
import { DIRECTION_SLUGS } from "@/data/navigation.ts";
import { categories, servicesInCategory } from "@/data/services.ts";
import { getContent, getCatalogueCopy } from "@/content/index.ts";
import { Split } from "@/components/motion/Split.tsx";
import { pageMetadata } from "@/lib/metadata.ts";
import { NextStep, PageHero } from "@/components/page/PageBlocks.tsx";
import { PriceTag, TimelineLabel } from "@/components/pricing/PriceTag.tsx";
import { ArrowUpRight } from "@/components/ui/icons.tsx";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tp = await getTranslations({ locale, namespace: "pages" });
  return pageMetadata({ title: tp("servicesMetaTitle"), description: tp("servicesMetaDescription"), path: "/services", locale });
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("common");
  const tp = await getTranslations("pages");
  const tNav = await getTranslations("nav");
  const copy = getCatalogueCopy(locale);
  const { topics } = getContent(locale);

  return (
    <>
      <PageHero
        crumbs={[{ label: tp("home"), href: "/" }, { label: tNav("services") }]}
        label={tp("servicesLabel")}
        title={[tp("servicesTitle1"), tp("servicesTitle2")]}
        lead={tp("servicesLead")}
      />

      <section className="section section--tight" aria-labelledby="directions-title">
        <div className="wrap">
          <h2 id="directions-title" className="sr-only">
            {tp("directions")}
          </h2>
          <ol role="list" className="directions" data-reveal-stagger>
            {DIRECTION_SLUGS.map((slug) => {
              const topic = topics[slug];
              return (
                <li key={slug}>
                  <Link href={`/${slug}`} className="directions__row" data-cursor={t("open")}>
                    <span className="directions__num">{topic.index}</span>
                    <span className="t-h3">{topic.label}</span>
                    <span className="t-body">{topic.lead}</span>
                    <span className="directions__open">
                      {t("open")} <ArrowUpRight />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="specific-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="specific-title" className="t-h2">
              <Split text={tp("specificTitle")} />
            </h2>
            <Link href="/price" className="link-arrow">
              {t("allPrices")} <ArrowUpRight />
            </Link>
          </div>
          <p className="t-lead specific__lead" data-reveal="up">
            {tp("specificLead")}
          </p>
          <div className="catalog">
            {categories.map((cat, ci) => {
              const items = servicesInCategory(cat.id);
              return (
                <section key={cat.id} className="catalog__group" aria-labelledby={`specific-${cat.id}`}>
                  <div className="catalog__side" data-reveal="up">
                    <span className="catalog__index">{String(ci + 1).padStart(2, "0")}</span>
                    <h3 id={`specific-${cat.id}`} className="catalog__title">
                      {copy.categoryCopy[cat.id].title}
                    </h3>
                    <p className="catalog__lead">{copy.categoryCopy[cat.id].lead}</p>
                    <p className="catalog__meta">
                      <span>{tp("servicesCount", { count: items.length })}</span>
                      <Link href={cat.directionPage} className="link-arrow">
                        {t("open")} <ArrowUpRight />
                      </Link>
                    </p>
                  </div>
                  <ul role="list" className="catalog__grid" data-reveal-stagger>
                    {items.map((s) => (
                      <li key={s.id}>
                        <Link href={s.detailPage} className="catalog__card spotlight" data-tilt="4">
                          <span className="catalog__card-top">
                            <span className="catalog__name">{copy.serviceCopy[s.id].name}</span>
                            <span className="catalog__arrow" aria-hidden="true">
                              <ArrowUpRight />
                            </span>
                          </span>
                          <span className="catalog__desc">{copy.serviceCopy[s.id].short}</span>
                          <span className="catalog__foot">
                            <span className="catalog__time">
                              <TimelineLabel serviceId={s.id} />
                            </span>
                            <PriceTag serviceId={s.id} size="s" showRenewal={false} />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <NextStep title={tp("servicesNextTitle")} body={tp("servicesNextBody")} />
    </>
  );
}
