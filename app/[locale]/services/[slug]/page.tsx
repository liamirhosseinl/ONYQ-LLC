import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation.ts";
import { getContent, getCatalogueCopy } from "@/content/index.ts";
import { servicePages as enServicePages } from "@/content/en/service-pages.ts";
import { Split } from "@/components/motion/Split.tsx";
import { getService } from "@/data/services.ts";
import { siteConfig } from "@/data/site-config.ts";
import { pageMetadata, absoluteUrl } from "@/lib/metadata.ts";
import { isVisible } from "@/lib/site-mode.ts";
import { NextStep, PageHero, PriceRow } from "@/components/page/PageBlocks.tsx";
import { Accordion } from "@/components/page/Accordion.tsx";
import { EstimateCard } from "@/components/pricing/EstimateCard.tsx";
import { PriceTag } from "@/components/pricing/PriceTag.tsx";
import { ArrowUpRight, Check } from "@/components/ui/icons.tsx";
import { ProposedTag } from "@/components/ui/Proposed.tsx";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return enServicePages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = getContent(locale).servicePages.find((p) => p.slug === slug);
  if (!page) return {};
  return pageMetadata({ title: page.meta.title, description: page.meta.description, path: `/services/${slug}`, locale });
}

export default async function ServiceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { servicePages, topics } = getContent(locale);
  const page = servicePages.find((p) => p.slug === slug);
  if (!page) notFound();

  const t = await getTranslations("common");
  const tp = await getTranslations("pages");
  const tNav = await getTranslations("nav");
  const copy = getCatalogueCopy(locale);
  const direction = topics[page.direction];
  const primary = getService(page.primary);
  const faq = page.faq.filter(isVisible);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.label,
      description: page.meta.description,
      provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
      areaServed: "Worldwide",
      url: absoluteUrl(`/services/${slug}`, locale),
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "PriceSpecification",
          minPrice: primary.regularPriceUsd,
          priceCurrency: "USD",
          ...(primary.billingType === "monthly" ? { unitText: "MONTH" } : {}),
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq
        .filter((f) => f.approval !== "proposed")
        .map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        crumbs={[
          { label: tp("home"), href: "/" },
          { label: tNav("services"), href: "/services" },
          { label: direction.label, href: `/${page.direction}` },
          { label: page.label },
        ]}
        title={page.title}
        lead={page.lead}
        serviceId={page.primary}
        side={<EstimateCard serviceId={page.primary} label={page.label} included={page.included.slice(0, 5)} />}
      />

      <section className="section benefits" aria-labelledby="benefits-title">
        <div className="wrap">
          <h2 id="benefits-title" className="t-h2">
            <Split text={tp("whatYouGet")} />
          </h2>
          <ol role="list" className="benefits__grid" data-reveal-stagger>
            {page.benefits.map((b, i) => (
              <li key={b.title}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="t-h4">{b.title}</h3>
                <p className="t-body">{b.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section included" aria-labelledby="included-title">
        <div className="wrap included__grid">
          <h2 id="included-title" className="t-h2">
            <Split text={tp("included")} />
          </h2>
          <ul role="list" className="included__list" data-reveal-stagger>
            {page.included.map((item) => (
              <li key={item}>
                <Check /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section process" aria-labelledby="process-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="process-title" className="t-h2">
              <Split text={tp("howItGoes")} />
            </h2>
            <span className="mono">{tp("indicative")}</span>
          </div>
          <ol role="list" className="process__grid" data-reveal-stagger>
            {page.process.map((p, i) => (
              <li key={p.title}>
                <p className="process__meta mono">
                  {String(i + 1).padStart(2, "0")} · {p.duration}
                </p>
                <span className="process__bar" aria-hidden="true" />
                <h3 className="t-h4">{p.title}</h3>
                <p className="t-small">{p.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section fit" aria-label={tp("rightService")}>
        <div className="wrap fit__grid">
          <div className="fit__col" data-reveal="up">
            <h2 className="t-h3">{tp("goodFit")}</h2>
            <ul role="list">
              {page.fit.map((f) => (
                <li key={f}>
                  <Check /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="fit__col fit__col--alt" data-reveal="up" style={{ ["--reveal-delay" as string]: "120ms" }}>
            <h2 className="t-h3">{tp("betterElse")}</h2>
            <ul role="list">
              {page.notFit.map((n) => {
                const alt = getService(n.alt);
                return (
                  <li key={n.text}>
                    <p>{n.text}</p>
                    <Link href={alt.detailPage} className="fit__alt">
                      <span>{copy.serviceCopy[n.alt].name}</span>
                      <PriceTag serviceId={n.alt} size="s" showRenewal={false} />
                      <ArrowUpRight />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="pricing-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="pricing-title" className="t-h2">
              <Split text={tp("pricing")} />
            </h2>
            <Link href="/price" className="link-arrow">
              {t("allPrices")} <ArrowUpRight />
            </Link>
          </div>
          <ul role="list" className="price-list" data-reveal-stagger>
            {page.priceIds.map((id) => (
              <PriceRow key={id} id={id} />
            ))}
          </ul>
        </div>
      </section>

      <section className="section faq-block" aria-labelledby="faq-title">
        <div className="wrap faq-block__grid">
          <h2 id="faq-title" className="t-h2">
            <Split text={tp("questions")} />
          </h2>
          <Accordion
            items={faq.map((f, i) => ({
              id: `q${i + 1}`,
              question: f.q,
              answer: (
                <>
                  <p>{f.a}</p>
                  {f.approval === "proposed" ? <ProposedTag /> : null}
                </>
              ),
            }))}
          />
        </div>
      </section>

      <section className="section see-also" aria-labelledby="see-also-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="see-also-title" className="t-h3">
              <Split text={tp("seeAlso")} />
            </h2>
            <Link href="/services" className="link-arrow">
              {t("allServices")} <ArrowUpRight />
            </Link>
          </div>
          <ul role="list" className="see-also__grid" data-reveal-stagger>
            {page.seeAlso.map((id) => (
              <li key={id}>
                <Link href={getService(id).detailPage} className="see-also__card spotlight" data-tilt="4">
                  <span className="t-h4">{copy.serviceCopy[id].name}</span>
                  <PriceTag serviceId={id} size="s" showRenewal={false} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <NextStep title={tp("serviceNextTitle")} body={tp("serviceNextBody")} />
    </>
  );
}
