"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { services, type ServiceId } from "@/data/services.ts";
import { getCatalogueCopy } from "@/content/catalogue.ts";
import { PriceTag } from "./PriceTag.tsx";
import { CurrencyNote, CurrencyToggle } from "./CurrencyToggle.tsx";
import { usePricing } from "./PricingProvider.tsx";

/** Paper receipt listing starting prices — "Most requested" on /price, per-area on direction pages. */
export function Receipt({ ids, title }: { ids?: ServiceId[]; title: string }) {
  const t = useTranslations("price");
  const locale = useLocale();
  const copy = getCatalogueCopy(locale).serviceCopy;
  const featured = ids ? ids.map((id) => services.find((s) => s.id === id)!) : services.filter((s) => s.featured);
  return (
    <div className="receipt" aria-label={title} data-tilt="4">
      <div className="receipt__head mono">
        <span>{title}</span>
        <span>ONYQ · 2026</span>
      </div>
      <ul role="list">
        {featured.map((s) => (
          <li key={s.id}>
            <span>{copy[s.id].name}</span>
            <span className="receipt__dots" aria-hidden="true" />
            <PriceTag serviceId={s.id} size="s" showRenewal={false} />
          </li>
        ))}
      </ul>
      <div className="receipt__foot">
        <p className="receipt__hint">{t("fromHint")}</p>
        <CurrencyToggle tone="paper" />
      </div>
      <CurrencyNote />
    </div>
  );
}

/** Sticky category navigation with the active section tracked on scroll. */
export function CategoryNav({ items, label }: { items: { anchor: string; label: string }[]; label: string }) {
  const [active, setActive] = useState(items[0]?.anchor);

  useEffect(() => {
    const sections = items.map((i) => document.getElementById(i.anchor)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [items]);

  return (
    <div className="cat-nav">
      <div className="wrap cat-nav__inner">
        <nav aria-label={label}>
          <ol role="list">
            {items.map((item, i) => (
              <li key={item.anchor}>
                <a href={`#${item.anchor}`} aria-current={active === item.anchor ? "true" : undefined}>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span> {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <CurrencyToggle />
      </div>
    </div>
  );
}

/** Campaign rules — shown only while the offer is active or previewed. */
export function PromoRules() {
  const t = useTranslations("price");
  const { status, isPromoPreview } = usePricing();
  if (status.state !== "active" && !isPromoPreview) return null;
  const percent = status.discountPercent;
  return (
    <section className="promo-rules wrap" aria-labelledby="promo-rules-title" data-promo-rules="true">
      <h2 id="promo-rules-title" className="t-h4">
        {t("promoRulesTitle", { percent })}
      </h2>
      <ul role="list">
        <li>{t("promoRuleOneTime")}</li>
        <li>{t("promoRuleMonthly", { percent })}</li>
        <li>{t("promoRuleAds")}</li>
        <li>{t("promoRuleFrom")}</li>
      </ul>
    </section>
  );
}
