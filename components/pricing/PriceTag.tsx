"use client";

import { useLocale, useTranslations } from "next-intl";
import { getService, type ServiceId } from "@/data/services.ts";
import { formatMoney, quoteService } from "@/lib/pricing.ts";
import { usePricing } from "./PricingProvider.tsx";

/**
 * The only component that prints a service price. Reads the catalogue, the active currency
 * and the campaign state from one place, so every page shows the same number.
 */
export function PriceTag({
  serviceId,
  size = "m",
  showRenewal = true,
}: {
  serviceId: ServiceId;
  size?: "s" | "m" | "l";
  showRenewal?: boolean;
}) {
  const t = useTranslations("common");
  const tp = useTranslations("price");
  const locale = useLocale();
  const { currency, status, amd } = usePricing();
  const service = getService(serviceId);
  const quote = quoteService(service, status, currency, amd);
  const suffix = service.billingType === "monthly" ? t("perMonthSuffix") : "";
  const regular = `${formatMoney(quote.regular, locale)}${suffix}`;

  if (!quote.promo) {
    return (
      <span className={`price price--${size}`} data-price={serviceId} data-currency={currency}>
        <span className="price__from">{t("from")}</span> <span className="price__amount">{regular}</span>
      </span>
    );
  }

  const promo = formatMoney(quote.promo, locale);
  return (
    <span className={`price price--${size} price--promo`} data-price={serviceId} data-currency={currency} data-promo="true">
      <span className="price__line">
        <span className="price__from">{t("from")}</span>{" "}
        <span className="sr-only">{tp("promoPrice")}: </span>
        <span className="price__amount">
          {promo}
          {service.billingType === "monthly" ? <span className="price__unit"> {tp("firstMonth")}</span> : null}
        </span>
        <span className="price__badge" aria-hidden="true">
          {tp("promoBadge", { percent: status.discountPercent })}
        </span>
      </span>
      <span className="price__regular">
        <span className="sr-only">{tp("regularPrice")}: </span>
        <s>{regular}</s>
      </span>
      {showRenewal && quote.renewal ? (
        <span className="price__renewal">{tp("thenRenews", { price: formatMoney(quote.renewal, locale) })}</span>
      ) : null}
    </span>
  );
}

/** Plain-language timeline label: "from 7 days", "from 3 weeks", "monthly". */
export function TimelineLabel({ serviceId }: { serviceId: ServiceId }) {
  const t = useTranslations("common");
  const tl = getService(serviceId).timeline;
  if (tl.kind === "monthly") return <>{t("monthly")}</>;
  if (tl.kind === "days") return <>{t("fromDays", { count: tl.from })}</>;
  if (tl.kind === "weeks") return <>{t("fromWeeks", { count: tl.from })}</>;
  return <>{t("fromMonths", { count: tl.from })}</>;
}
