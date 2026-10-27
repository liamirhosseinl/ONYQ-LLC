import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation.ts";
import { categories, servicesInCategory, PRICE_LIST_EFFECTIVE_FROM } from "@/data/services.ts";
import { getContent, getCatalogueCopy } from "@/content/index.ts";
import { Split } from "@/components/motion/Split.tsx";
import { pageMetadata } from "@/lib/metadata.ts";
import { isVisible } from "@/lib/site-mode.ts";
import { NextStep, PageHero, PriceRow } from "@/components/page/PageBlocks.tsx";
import { Accordion } from "@/components/page/Accordion.tsx";
import { CategoryNav, PromoRules, Receipt } from "@/components/pricing/PricingClientBits.tsx";
import { PromoNotice } from "@/components/pricing/PromoNotice.tsx";
import { ProposedTag } from "@/components/ui/Proposed.tsx";
import { ArrowUpRight } from "@/components/ui/icons.tsx";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { pricingPage } = getContent(locale);
  return pageMetadata({ title: pricingPage.meta.title, description: pricingPage.meta.description, path: "/price", locale });
}

export default async function PricePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("common");
  const tp = await getTranslations("price");
  const format = await getFormatter();
  const copy = getCatalogueCopy(locale);
  const { pricingPage } = getContent(locale);
  const tPages = await getTranslations("pages");
  const faq = pricingPage.faq.filter(isVisible);

  return (
    <>
      <PageHero
        eyebrow={`ONYQ / ${tPages("pricing")}`}
        label={
          PRICE_LIST_EFFECTIVE_FROM
            ? tp("validFrom", { date: format.dateTime(new Date(PRICE_LIST_EFFECTIVE_FROM), { dateStyle: "long" }) })
            : undefined
        }
        title={pricingPage.hero.title}
        lead={pricingPage.hero.lead}
        actionLabel={pricingPage.hero.cta}
        side={<Receipt title={tPages("mostRequested")} />}
      />

      <div className="wrap">
        <PromoNotice />
      </div>
      <PromoRules />

      <CategoryNav label={tPages("priceCategories")} items={categories.map((c) => ({ anchor: c.anchor, label: copy.categoryCopy[c.id].title }))} />

      <div className="price-cats">
        {categories.map((cat, i) => (
          <section key={cat.id} id={cat.anchor} className="price-cat" aria-labelledby={`${cat.anchor}-title`}>
            <div className="wrap price-cat__grid">
              <div className="price-cat__intro" data-reveal="up">
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <h2 id={`${cat.anchor}-title`} className="t-h2">
                  <Split text={copy.categoryCopy[cat.id].title} />
                </h2>
                <p className="t-body">{copy.categoryCopy[cat.id].lead}</p>
                <Link href={cat.directionPage} className="link-arrow">
                  {t("moreAboutService")} <ArrowUpRight />
                </Link>
              </div>
              <ul role="list" className="price-list" data-reveal-stagger>
                {servicesInCategory(cat.id).map((s) => (
                  <PriceRow key={s.id} id={s.id} />
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <section className="section every-price" aria-labelledby="every-title">
        <div className="wrap">
          <>
            <h2 id="every-title" className="t-h3">
              {pricingPage.inEveryPrice.title}
            </h2>
            <ul role="list" className="every-price__grid" data-reveal-stagger>
              {pricingPage.inEveryPrice.items.map((item) => (
                <li key={item.title}>
                  <p className="t-h3">{item.title}</p>
                  <p className="t-small">{item.body}</p>
                </li>
              ))}
            </ul>
          </>
        </div>
      </section>

      <section className="section depends" aria-labelledby="depends-title">
        <div className="wrap">
          <h2 id="depends-title" className="t-h2">
            <Split text={pricingPage.dependsOn.title} />
          </h2>
          <ol role="list" className="depends__grid" data-reveal-stagger>
            {pricingPage.dependsOn.items.map((item, i) => (
              <li key={item.title}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="t-h4">{item.title}</h3>
                <p className="t-small">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section faq-block" aria-labelledby="pricing-faq-title">
        <div className="wrap faq-block__grid">
          <h2 id="pricing-faq-title" className="t-h2">
            <Split text={tPages("pricingQuestions")} />
          </h2>
          <Accordion
            items={faq.map((f, i) => ({
              id: `pricing-q${i + 1}`,
              question: f.q,
              answer: (
                <>
                  <p>{f.a}</p>
                  {"approval" in f && f.approval === "proposed" ? <ProposedTag /> : null}
                </>
              ),
            }))}
          />
        </div>
      </section>

      <NextStep title={pricingPage.next.title} body={pricingPage.next.body} cta={pricingPage.hero.cta} />
    </>
  );
}
