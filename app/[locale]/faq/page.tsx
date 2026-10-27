import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation.ts";
import { getContent } from "@/content/index.ts";
import type { FaqItem } from "@/content/types.ts";
import { pageMetadata } from "@/lib/metadata.ts";
import { isVisible } from "@/lib/site-mode.ts";
import { NextStep, PageHero } from "@/components/page/PageBlocks.tsx";
import { Accordion } from "@/components/page/Accordion.tsx";
import { ProposedTag } from "@/components/ui/Proposed.tsx";
import { ArrowUpRight } from "@/components/ui/icons.tsx";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { faqPage } = getContent(locale);
  return pageMetadata({ title: faqPage.meta.title, description: faqPage.meta.description, path: "/faq", locale });
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { faqPage, pricingPage, servicePages } = getContent(locale);
  const tp = await getTranslations("pages");
  const t = await getTranslations("common");

  const groups: { id: string; title: string; items: FaqItem[]; href?: string }[] = [
    { id: "working-with-onyq", title: faqPage.general.title, items: faqPage.general.items },
    { id: "pricing-and-payment", title: tp("faqPricingTitle"), items: pricingPage.faq, href: "/price" },
    ...servicePages.map((p) => ({ id: p.slug, title: p.label, items: p.faq, href: `/services/${p.slug}` })),
  ]
    .map((g) => ({ ...g, items: g.items.filter(isVisible) }))
    .filter((g) => g.items.length > 0);

  const count = groups.reduce((n, g) => n + g.items.length, 0);
  const approved = groups.flatMap((g) => g.items).filter((f) => f.approval !== "proposed");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: approved.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        crumbs={[{ label: tp("home"), href: "/" }, { label: tp("faqCrumb") }]}
        label={tp("questionsCount", { count })}
        title={faqPage.title}
        lead={faqPage.lead}
      />
      <section className="section section--tight">
        <div className="wrap faq-page">
          <nav className="faq-index" aria-label={tp("faqTopics")} data-lenis-prevent>
            <p className="eyebrow eyebrow--muted">{tp("topics")}</p>
            <ol role="list">
              {groups.map((g, i) => (
                <li key={g.id}>
                  <a href={`#${g.id}`}>
                    <span className="num">{String(i + 1).padStart(2, "0")}</span>
                    {g.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="faq-groups">
            {groups.map((g) => (
              <section key={g.id} id={g.id} className="faq-group" aria-labelledby={`${g.id}-title`} data-reveal="up">
                <div className="section-head">
                  <h2 id={`${g.id}-title`} className="t-h3">
                    {g.title}
                  </h2>
                  {g.href ? (
                    <Link href={g.href} className="link-arrow">
                      {t("open")} <ArrowUpRight />
                    </Link>
                  ) : null}
                </div>
                <Accordion
                  items={g.items.map((f, i) => ({
                    id: `${g.id}-q${i + 1}`,
                    question: f.q,
                    answer: (
                      <>
                        <p>{f.a}</p>
                        {f.approval === "proposed" ? <ProposedTag /> : null}
                      </>
                    ),
                  }))}
                />
              </section>
            ))}
          </div>
        </div>
      </section>
      <NextStep title={tp("faqNextTitle")} body={tp("faqNextBody")} />
    </>
  );
}
