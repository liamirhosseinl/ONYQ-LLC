import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { IS_PREVIEW } from "@/lib/site-mode.ts";

/**
 * Wraps copy that ONYQ still has to approve (commercial terms, response times, policy answers).
 * Preview mode: rendered with a visible marker. Production mode: not rendered at all.
 */
export async function Proposed({ children, inline = false }: { children: ReactNode; inline?: boolean }) {
  if (!IS_PREVIEW) return null;
  const t = await getTranslations("common");
  const Tag = inline ? "span" : "div";
  return (
    <Tag className={inline ? "proposed proposed--inline" : "proposed"} data-proposed="true">
      <span className="proposed__tag" title={t("needsApprovalHint")}>
        {t("needsApproval")}
      </span>
      {children}
    </Tag>
  );
}

/** Small marker for a single item inside a list that is otherwise approved. */
export async function ProposedTag() {
  if (!IS_PREVIEW) return null;
  const t = await getTranslations("common");
  return (
    <span className="proposed__tag proposed__tag--solo" title={t("needsApprovalHint")}>
      {t("needsApproval")}
    </span>
  );
}
