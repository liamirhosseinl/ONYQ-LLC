import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation.ts";
import type { ServiceId } from "@/data/services.ts";
import { getService } from "@/data/services.ts";
import { getSiteContact } from "@/lib/server/site-settings.ts";
import { getCatalogueCopy } from "@/content/catalogue.ts";
import { isVisible } from "@/lib/site-mode.ts";
import { OpenBriefButton } from "@/components/brief/OpenBriefButton.tsx";
import { PriceTag, TimelineLabel } from "@/components/pricing/PriceTag.tsx";
import { ArrowRight, ArrowUpRight } from "@/components/ui/icons.tsx";
import { ProposedTag } from "@/components/ui/Proposed.tsx";
import { Spark } from "@/components/ui/Wordmark.tsx";
import { Constellation } from "@/components/art/BrandArt.tsx";
import { Split, SplitLines } from "@/components/motion/Split.tsx";

export async function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const tA = await getTranslations("a11y");
  return (
    <nav aria-label={tA("breadcrumb")} className="crumbs" data-reveal="fade">
      <ol role="list">
        {items.map((item, i) => (
          <li key={item.label}>
            {item.href && i < items.length - 1 ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export async function PageHero({
  eyebrow,
  label,
  title,
  lead,
  side,
  crumbs,
  actions = true,
  actionLabel,
  serviceId,
}: {
  eyebrow?: string;
  label?: string;
  title: readonly [string, string] | string;
  lead: string;
  side?: ReactNode;
  crumbs?: { label: string; href?: string }[];
  actions?: boolean;
  actionLabel?: string;
  serviceId?: ServiceId;
}) {
  const t = await getTranslations("common");
  return (
    <header className="page-hero">
      <div className="page-hero__art" aria-hidden="true">
        <Constellation count={12} seed={label?.length ?? 5} className="page-hero__stars" />
      </div>
      <div className="wrap">
        <div className="page-hero__top">
          {crumbs ? <Breadcrumbs items={crumbs} /> : <p className="eyebrow eyebrow--muted">{eyebrow}</p>}
          {label ? (
            <p className="eyebrow page-hero__label" data-reveal="fade">
              <Spark className="eyebrow__spark" />
              {label}
            </p>
          ) : null}
        </div>
        <div className={`page-hero__grid${side ? " page-hero__grid--side" : ""}`}>
          <div className="page-hero__main">
            <h1 className="t-h1">{Array.isArray(title) ? <SplitLines lines={title} /> : <Split text={title as string} />}</h1>
            <p className="t-lead page-hero__lead" data-reveal="up" style={{ ["--reveal-delay" as string]: "180ms" }}>
              {lead}
            </p>
            {actions ? (
              <div className="page-hero__actions" data-reveal="up" style={{ ["--reveal-delay" as string]: "280ms" }}>
                <OpenBriefButton className="btn btn--primary" serviceId={serviceId} magnetic>
                  {actionLabel ?? t("discussProject")} <ArrowUpRight />
                </OpenBriefButton>
                {getSiteContact().salesEmail ? (
                  <a className="btn btn--text" href={`mailto:${getSiteContact().salesEmail}`}>
                    {getSiteContact().salesEmail}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
          {side ? (
            <div className="page-hero__side" data-reveal="up" style={{ ["--reveal-delay" as string]: "240ms" }}>
              {side}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/** Row used on the pricing page and on service pages. */
export async function PriceRow({ id, headingLevel = "h3" }: { id: ServiceId; headingLevel?: "h3" | "h4" }) {
  const locale = await getLocale();
  const t = await getTranslations("common");
  const tp = await getTranslations("price");
  const copy = getCatalogueCopy(locale).serviceCopy[id];
  const service = getService(id);
  const H = headingLevel;
  return (
    <li className="price-row" id={`service-${id}`}>
      <div className="price-row__name">
        <H className="price-row__title">
          <Link href={service.detailPage}>{copy.name}</Link>
        </H>
        <p className="t-small">{copy.short}</p>
        {service.thirdPartySpendSeparate ? <p className="price-row__note">{tp("adSpendSeparate")}</p> : null}
      </div>
      <p className="price-row__time mono">
        <span className="sr-only">{t("timeline")}: </span>
        <TimelineLabel serviceId={id} />
      </p>
      <div className="price-row__price">
        <PriceTag serviceId={id} />
      </div>
      <div className="price-row__cta">
        <OpenBriefButton className="btn btn--ghost btn--small" serviceId={id} ariaLabel={`${t("discuss")}: ${copy.name}`}>
          {t("discuss")} <ArrowRight />
        </OpenBriefButton>
      </div>
    </li>
  );
}

export async function ServiceCards({ ids, title }: { ids: ServiceId[]; title: string }) {
  if (ids.length === 0) return null;
  const locale = await getLocale();
  const tp = await getTranslations("pages");
  const copy = getCatalogueCopy(locale).serviceCopy;
  return (
    <section className="section service-cards" aria-labelledby="service-cards-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="service-cards-title" className="t-h3">
            <Split text={title} />
          </h2>
          <Link href="/price" className="link-arrow">
            {tp("pricing")} <ArrowUpRight />
          </Link>
        </div>
        <ul role="list" className="service-cards__grid" data-reveal-stagger>
          {ids.map((id) => {
            const s = getService(id);
            return (
              <li key={id} className="service-card spotlight" data-tilt="4">
                <Link href={s.detailPage} className="service-card__link">
                  <span className="service-card__name t-h4">{copy[id].name}</span>
                  <span className="t-small">{copy[id].short}</span>
                  <span className="service-card__foot">
                    <PriceTag serviceId={id} size="s" showRenewal={false} />
                    <ArrowUpRight />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export async function NextStep({ title, body, eyebrow, cta }: { title: string; body: string; eyebrow?: string; cta?: string }) {
  const t = await getTranslations("common");
  const tp = await getTranslations("pages");
  const steps = (tp.raw("nextSteps") as { title: string; body: string; approval?: "proposed" }[]).filter(isVisible);
  return (
    <section className="next-step" aria-labelledby="next-step-title">
      <div className="wrap next-step__inner">
        <div className="next-step__main">
          <p className="eyebrow" data-reveal="up">
            <Spark className="eyebrow__spark" />
            {eyebrow ?? tp("nextStep")}
          </p>
          <h2 id="next-step-title" className="t-h1">
            <Split text={title} />
          </h2>
          <p className="t-lead" data-reveal="up">
            {body}
          </p>
          <div className="next-step__actions" data-reveal="up">
            <OpenBriefButton className="btn btn--primary btn--large" magnetic>
              {cta ?? t("discussProject")} <ArrowUpRight />
            </OpenBriefButton>
            {getSiteContact().salesEmail ? (
              <a className="btn btn--text" href={`mailto:${getSiteContact().salesEmail}`}>
                {getSiteContact().salesEmail}
              </a>
            ) : null}
          </div>
        </div>
        <aside className="next-step__card" aria-label={tp("whatHappensNext")} data-reveal="right">
          <p className="eyebrow eyebrow--muted">{tp("whatHappensNext")}</p>
          <ol role="list">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="next-step__step">{s.title}</p>
                  <p className="t-small">{s.body}</p>
                  {s.approval === "proposed" ? <ProposedTag /> : null}
                </div>
              </li>
            ))}
          </ol>
          {getSiteContact().telegram ? (
            <a className="next-step__tg" href={`https://t.me/${getSiteContact().telegram}`} target="_blank" rel="noopener noreferrer">
              Telegram · @{getSiteContact().telegram}
            </a>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
