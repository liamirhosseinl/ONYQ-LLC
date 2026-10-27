import { getTranslations } from "next-intl/server";
import { IS_PREVIEW } from "@/lib/site-mode.ts";

/**
 * Small fixed label in preview builds so nobody mistakes a review deployment for the live site.
 * Not rendered when NEXT_PUBLIC_SITE_MODE=production.
 */
export async function PreviewRibbon() {
  if (!IS_PREVIEW) return null;
  const t = await getTranslations("common");
  return (
    <p className="preview-ribbon" role="note">
      <span className="preview-ribbon__long">{t("previewLong")}</span>
      <span className="preview-ribbon__short">{t("previewShort")}</span>
    </p>
  );
}
