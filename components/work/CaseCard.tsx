import Image from "next/image";
import type { CSSProperties } from "react";
import { Link } from "@/i18n/navigation.ts";
import type { CaseStudy } from "@/data/cases.ts";
import type { CaseCopy } from "@/content/types.ts";
import { ArrowUpRight } from "@/components/ui/icons.tsx";
import { Spark } from "@/components/ui/Wordmark.tsx";
import { formatNumber } from "@/lib/format.ts";

/**
 * Large case card: cover with inner parallax, name, teaser, facts and the headline metric.
 * Used by the homepage stack and the portfolio index.
 */
export function CaseCard({
  study,
  copy,
  index,
  total,
  locale,
  labels,
  priority = false,
}: {
  study: CaseStudy;
  copy: CaseCopy;
  index: number;
  total: number;
  locale: string;
  labels: { view: string; nda: string };
  priority?: boolean;
}) {
  const fmt = { format: (n: number) => formatNumber(n, locale) };
  return (
    <article
      className="case-card"
      style={{ "--case-accent": study.accent, "--case-ink": study.accentInk, "--i": index } as CSSProperties}
      aria-labelledby={`case-${study.slug}-title`}
    >
      <Link href={`/portfolio/${study.slug}`} className="case-card__link" data-cursor={labels.view}>
        <div className={`case-card__media${study.cover.cutout ? " case-card__media--cutout" : ""}`}>
          <div className="case-card__img" data-parallax="0.12">
            <Image
              src={study.cover.src}
              width={study.cover.width}
              height={study.cover.height}
              alt={copy.alts[study.cover.alt] ?? copy.name}
              sizes="(max-width: 900px) 100vw, 62vw"
              priority={priority}
            />
          </div>
          <span className="case-card__count" aria-hidden="true">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
        <div className="case-card__body">
          <div className="case-card__meta">
            <span>{copy.industry}</span>
            <span>{study.year}</span>
          </div>
          <h3 id={`case-${study.slug}-title`} className="case-card__title">
            {copy.name}
          </h3>
          <p className="case-card__teaser">{copy.teaser}</p>
          <ul role="list" className="case-card__tags">
            {copy.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {study.metric ? (
            <p className="case-card__metric">
              <Spark className="case-card__spark" />
              <strong>
                {study.metric.prefix}
                {fmt.format(study.metric.value)}
                {study.metric.suffix}
              </strong>
              <span>{copy.metricLabel}</span>
            </p>
          ) : null}
          <span className="case-card__cta">
            {labels.view}
            <ArrowUpRight />
          </span>
          {!study.client ? <span className="case-card__nda">{labels.nda}</span> : null}
        </div>
      </Link>
    </article>
  );
}
