"use client";

import { useLocale, useTranslations } from "next-intl";
import { promotion } from "@/data/promotion.ts";
import type { ServiceId } from "@/data/services.ts";
import { getService } from "@/data/services.ts";
import { PriceTag, TimelineLabel } from "./PriceTag.tsx";
import { CurrencyToggle, CurrencyNote } from "./CurrencyToggle.tsx";
import { usePricing } from "./PricingProvider.tsx";

/** Paper "estimate" card on service pages (reference: ESTIMATE · SERVICE card). */
export function EstimateCard({ serviceId, label, included }: { serviceId: ServiceId; label: string; included: string[] }) {
  const t = useTranslations("common");
  const tp = useTranslations("price");
  const locale = useLocale();
  const { status } = usePricing();
  const service = getService(serviceId);
  return (
    <aside className="estimate" aria-label={tp("estimate", { label })} data-tilt="3">
      <div className="estimate__head mono">
        <span>{tp("estimate", { label })}</span>
        <span>ONYQ</span>
      </div>
      <div className="estimate__price">
        <PriceTag serviceId={serviceId} size="l" />
      </div>
      <p className="estimate__time">
        {t("timeline")}: <TimelineLabel serviceId={serviceId} />
      </p>
      {status.state === "active" ? (
        <p className="estimate__promo">
          {service.billingType === "monthly"
            ? tp("promoMonthly", { percent: status.discountPercent })
            : status.endsAt
              ? tp("promoOneTime", {
                  percent: status.discountPercent,
                  end: new Intl.DateTimeFormat(locale, { timeZone: promotion.timezone, dateStyle: "long", timeStyle: "short" }).format(status.endsAt),
                })
              : tp("promoOneTimeOpen", { percent: status.discountPercent })}
        </p>
      ) : null}
      <p className="estimate__label mono">{tp("includedInPrice")}</p>
      <ul role="list">
        {included.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="estimate__foot">
        <CurrencyToggle tone="paper" />
        <p className="estimate__hint">{tp("fromHint")}</p>
      </div>
      <CurrencyNote />
    </aside>
  );
}
