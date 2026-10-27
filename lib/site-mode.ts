/**
 * Site mode.
 *
 * - "production" (default): the live site. Indexable; anything still marked "proposed" is hidden;
 *   the promotion appears only when data/promotion.ts is enabled with real dates.
 * - "preview": set NEXT_PUBLIC_SITE_MODE=preview for a review build: "Needs approval" markers,
 *   ?promo=preview, a "Preview build" label and no indexing.
 */
export type SiteMode = "preview" | "production";

/** Production by default (approved for launch 27 Oct 2026); set NEXT_PUBLIC_SITE_MODE=preview for a review build. */
export const SITE_MODE: SiteMode =
  process.env.NEXT_PUBLIC_SITE_MODE === "preview" ? "preview" : "production";

export const IS_PREVIEW = SITE_MODE === "preview";

/** Content that is drafted but not yet approved by ONYQ. */
export interface Approvable {
  approval?: "approved" | "proposed";
}

/** Proposed items are visible in preview mode only. */
export function isVisible(item: object): boolean {
  return (item as Approvable).approval !== "proposed" || IS_PREVIEW;
}

export function visible<T extends object>(items: T[]): T[] {
  return items.filter(isVisible);
}
