"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { promotion } from "@/data/promotion.ts";
import { usePricing } from "./PricingProvider.tsx";

function formatInZone(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: promotion.timezone,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function remaining(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
}

/**
 * Campaign banner. Renders nothing unless the offer is genuinely active (or scheduled),
 * or previewed in preview mode. The countdown reads the configured end time and
 * disappears with the offer.
 */
export function PromoNotice() {
  const t = useTranslations("price");
  const locale = useLocale();
  const { status, isPromoPreview } = usePricing();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (status.state !== "active" || !status.endsAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [status]);

  if (isPromoPreview) {
    return (
      <div className="promo-notice promo-notice--preview" role="note" data-promo-notice="preview">
        <strong>{t("promoPreviewTitle")}</strong>
        <span>{t("promoPreviewBody", { percent: status.discountPercent })}</span>
      </div>
    );
  }

  if (status.state === "scheduled" && status.startsAt) {
    return (
      <div className="promo-notice" role="note" data-promo-notice="scheduled">
        <span>{t("promoScheduled", { percent: status.discountPercent, start: formatInZone(status.startsAt, locale) })}</span>
      </div>
    );
  }

  if (status.state !== "active" || !status.startsAt || !status.endsAt) return null;

  return (
    <div className="promo-notice promo-notice--active" role="note" data-promo-notice="active">
      <strong>{t("promoBannerTitle", { percent: status.discountPercent })}</strong>
      <span>
        {t("promoBannerBody", { start: formatInZone(status.startsAt, locale), end: formatInZone(status.endsAt, locale) })}
      </span>
      {now !== null ? <span className="mono">{t("promoEndsIn", { time: remaining(status.endsAt.getTime() - now) })}</span> : null}
    </div>
  );
}
