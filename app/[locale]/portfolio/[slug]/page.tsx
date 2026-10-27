import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation.ts";
import { caseStudies, getCase } from "@/data/cases.ts";
import { getService } from "@/data/services.ts";
import { siteConfig } from "@/data/site-config.ts";
import { getContent, getCatalogueCopy } from "@/content/index.ts";
import { pageMetadata, absoluteUrl } from "@/lib/metadata.ts";
import { Breadcrumbs, NextStep } from "@/components/page/PageBlocks.tsx";
import { PriceTag } from "@/components/pricing/PriceTag.tsx";
import { Split } from "@/components/motion/Split.tsx";
import { Spark } from "@/components/ui/Wordmark.tsx";
import { ArrowUpRight } from "@/components/ui/icons.tsx";
import { formatNumber } from "@/lib/format.ts";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const study = getCase(slug);
  if (!study) return {};
  const copy = getContent(locale).cases[slug];
  const meta = pageMetadata({ title: `${copy.name} — ${copy.industry}`, description: copy.summary, path: `/portfolio/${slug}`, locale });
  return {
    ...meta,
    openGraph: { ...meta.openGraph, images: [{ url: study.cover.src, width: study.cover.width, height: study.cover.height, alt: copy.alts[study.cover.alt] }] },
  };
}

export default async function CasePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const study = getCase(slug);
  if (!study) notFound();

  const { cases } = getContent(locale);
  const copy = cases[slug];
  const catalogue = getCatalogueCopy(locale).serviceCopy;
  const t = await getTranslations("work");
  const tp = await getTranslations("pages");
  const tNav = await getTranslations("nav");
  const tA = await getTranslations("a11y");
  const fmt = { format: (n: number) => formatNumber(n, locale) };
  const index = caseStudies.findIndex((c) => c.slug === slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: copy.name,
    description: copy.summary,
    dateCreated: String(study.year),
    image: absoluteUrl(study.cover.src, locale),
    url: absoluteUrl(`/portfolio/${slug}`, locale),
    creator: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    ...(study.client ? { sourceOrganization: { "@type": "Organization", name: study.client } } : {}),
  };

  const style = { "--case-accent": study.accent, "--case-ink": study.accentInk } as CSSProperties;

  return (
    <article className="case" style={style} aria-labelledby="case-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <header className="case-hero">
        <div className="case-hero__art" aria-hidden="true">
          <div className="case-hero__glow" />
        </div>
        <div className="wrap">
          <div className="case-hero__top">
            <Breadcrumbs items={[{ label: tp("home"), href: "/" }, { label: tNav("work"), href: "/portfolio" }, { label: copy.name }]} />
            <p className="eyebrow" data-reveal="fade">
              <span className="case-hero__index">
                {String(index + 1).padStart(2, "0")} / {String(caseStudies.length).padStart(2, "0")}
              </span>
              {study.year}
            </p>
          </div>
          <h1 id="case-title" className="t-giant case-hero__title">
            <Split text={copy.name} />
          </h1>
          <div className="case-hero__grid">
            <p className="case-hero__teaser" data-reveal="up">
              <Spark className="case-hero__spark" />
              {copy.teaser}
            </p>
            <dl className="case-facts" data-reveal-stagger>
              <div>
                <dt>{t("client")}</dt>
                <dd>{study.client ?? t("nda")}</dd>
              </div>
              <div>
                <dt>{t("industry")}</dt>
                <dd>{copy.industry}</dd>
              </div>
              <div>
                <dt>{t("year")}</dt>
                <dd>{study.year}</dd>
              </div>
              <div>
                <dt>{t("services")}</dt>
                <dd>{copy.tags.join(" · ")}</dd>
              </div>
              {study.url ? (
                <div>
                  <dt>{t("website")}</dt>
                  <dd>
                    <a href={study.url} target="_blank" rel="noopener noreferrer" className="case-facts__link">
                      {study.url.replace(/^https?:\/\/(www\.)?/, "")}
                      <ArrowUpRight />
                      <span className="sr-only"> ({tA("opensInNewTab")})</span>
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </header>

      <div className="wrap">
        <figure className={`case-cover${study.cover.cutout ? " case-cover--cutout" : ""}`} data-scale-in="0.86">
          <div className="case-cover__img" data-parallax="0.12">
            <Image
              src={study.cover.src}
              width={study.cover.width}
              height={study.cover.height}
              alt={copy.alts[study.cover.alt]}
              sizes="(max-width: 1600px) 100vw, 1600px"
              priority
            />
          </div>
        </figure>
      </div>

      <section className="section case-story" aria-label={t("overview")}>
        <div className="wrap">
          <p className="case-story__summary">
            <Split text={copy.summary} />
          </p>
          <div className="case-story__grid" data-reveal-stagger>
            <div className="case-story__col">
              <p className="case-story__label">
                <span>01</span>
                {t("challenge")}
              </p>
              <p className="case-story__text">{copy.challenge}</p>
            </div>
            <div className="case-story__col">
              <p className="case-story__label">
                <span>02</span>
                {t("approach")}
              </p>
              <p className="case-story__text">{copy.approach}</p>
            </div>
            <div className="case-story__col">
              <p className="case-story__label">
                <span>03</span>
                {t("scope")}
              </p>
              <ul role="list" className="case-story__scope">
                {copy.scope.map((s) => (
                  <li key={s}>
                    <Spark className="case-story__bullet" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="case-result" aria-labelledby="case-result-title">
        <div className="wrap case-result__grid">
          <div>
            <p className="eyebrow" data-reveal="up">
              <Spark className="eyebrow__spark" />
              {t("result")}
            </p>
            <h2 id="case-result-title" className="case-result__text">
              <Split text={copy.result} />
            </h2>
            <p className="case-result__note" data-reveal="fade">
              {t("resultNote")}
            </p>
          </div>
          {study.metric ? (
            <div className="case-result__metric" data-reveal="scale">
              <p className="case-result__value">
                <span data-count={study.metric.value} data-count-prefix={study.metric.prefix ?? ""} data-count-suffix={study.metric.suffix ?? ""}>
                  {study.metric.prefix}
                  {fmt.format(study.metric.value)}
                  {study.metric.suffix}
                </span>
              </p>
              <p className="case-result__label">{copy.metricLabel}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section case-gallery" aria-label={t("gallery")}>
        <div className="wrap case-gallery__grid">
          {study.gallery.map((img, i) => (
            <figure
              key={img.src}
              className={`case-shot case-shot--${img.span ?? "half"}${img.cutout ? " case-shot--cutout" : ""}`}
              data-reveal="clip"
              style={{ ["--reveal-delay" as string]: `${(i % 2) * 120}ms` }}
            >
              {img.video ? (
                <video src={img.video} poster={img.src} muted loop playsInline autoPlay preload="none" aria-label={copy.alts[img.alt] ?? ""} />
              ) : (
                <Image src={img.src} width={img.width} height={img.height} alt={copy.alts[img.alt] ?? ""} sizes={img.span === "full" ? "(max-width: 1200px) 100vw, 1080px" : img.span === "reel" ? "(max-width: 900px) 50vw, 270px" : "(max-width: 900px) 100vw, 540px"} />
              )}
            </figure>
          ))}
        </div>
      </section>

      {study.palette ? (
        <section className="section section--tight case-palette" aria-labelledby="palette-title">
          <div className="wrap">
            <h2 id="palette-title" className="t-h3">
              <Split text={t("palette")} />
            </h2>
            <ul role="list" className="case-palette__list" data-reveal-stagger>
              {study.palette.map((p) => (
                <li key={p.hex} style={{ ["--swatch" as string]: p.hex }}>
                  <span className="case-palette__chip" aria-hidden="true" />
                  <span className="case-palette__name">{t(`paletteRoles.${p.key}`)}</span>
                  <span className="case-palette__hex">{p.hex}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="section section--tight case-services" aria-labelledby="case-services-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="case-services-title" className="t-h3">
              <Split text={t("servicesUsed")} />
            </h2>
            <Link href="/price" className="link-arrow">
              {tp("pricing")} <ArrowUpRight />
            </Link>
          </div>
          <ul role="list" className="case-services__list" data-reveal-stagger>
            {study.services.map((id) => (
              <li key={id}>
                <Link href={getService(id).detailPage} className="case-services__item">
                  <span>{catalogue[id].name}</span>
                  <PriceTag serviceId={id} size="s" showRenewal={false} />
                  <ArrowUpRight />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <NextStep title={tp("caseNextTitle")} body={tp("caseNextBody")} />
    </article>
  );
}
