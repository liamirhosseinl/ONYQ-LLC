/**
 * 59% campaign configuration — the only place promotion rules live.
 *
 * Production rule (brief §6.1): keep `enabled: false` until ONYQ supplies approved
 * start/end timestamps and eligibility terms. Times are wall-clock times in
 * `timezone` written as "YYYY-MM-DD HH:mm". The window is [start, end):
 * the promotion is active from the start minute and ends exactly at the end minute.
 */
export interface PromotionConfig {
  enabled: boolean;
  discountPercent: number;
  /** "YYYY-MM-DD HH:mm" in `timezone`, or null while unconfigured. [ONYQ INPUT REQUIRED] */
  startLocal: string | null;
  /** "YYYY-MM-DD HH:mm" in `timezone`, or null while unconfigured. [ONYQ INPUT REQUIRED] */
  endLocal: string | null;
  timezone: string;
  /** Monthly services: only the first paid month is discounted; renewals are full price. */
  monthlyServiceDiscountAppliesToFirstPaidMonthOnly: true;
  /** [ONYQ INPUT REQUIRED] Can the offer be combined with other discounts? */
  combinableWithOtherOffers: boolean | null;
  /** [ONYQ INPUT REQUIRED] What happens when a brief is sent before expiry but the quote is approved after? */
  quoteValidityRule: string | null;
}

export const promotion: PromotionConfig = {
  enabled: false,
  discountPercent: 59,
  startLocal: null,
  endLocal: null,
  timezone: "Asia/Yerevan",
  monthlyServiceDiscountAppliesToFirstPaidMonthOnly: true,
  combinableWithOtherOffers: null,
  quoteValidityRule: null,
};
