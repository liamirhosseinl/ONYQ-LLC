"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Close } from "@/components/ui/icons.tsx";
import { Wordmark } from "@/components/ui/Wordmark.tsx";
import { useFocusTrap } from "@/components/ui/useFocusTrap.ts";
import { BriefFlow } from "./BriefFlow.tsx";
import { useBrief } from "./BriefProvider.tsx";

export function BriefDialog() {
  const t = useTranslations("brief");
  const tA = useTranslations("a11y");
  const { close } = useBrief();
  const panel = useRef<HTMLDivElement>(null);

  useFocusTrap(panel, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.dataset.scrollLock = "true";
    // Make everything behind the dialog inert (true modal for keyboard and screen readers).
    const siblings = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== panel.current && !el.hasAttribute("inert"),
    );
    siblings.forEach((el) => el.setAttribute("inert", ""));
    return () => {
      document.removeEventListener("keydown", onKey);
      delete document.body.dataset.scrollLock;
      siblings.forEach((el) => el.removeAttribute("inert"));
    };
  }, [close]);

  return (
    <div className="brief-dialog" role="dialog" aria-modal="true" aria-label={t("dialogLabel")} ref={panel} data-lenis-prevent>
      <div className="brief-dialog__bar">
        <span className="brief-dialog__brand">
          <Wordmark />
        </span>
        <button type="button" className="icon-btn" onClick={close} aria-label={tA("closeBrief")}>
          <Close size={20} />
        </button>
      </div>
      <div className="brief-dialog__inner">
        <BriefFlow variant="dialog" />
      </div>
    </div>
  );
}
