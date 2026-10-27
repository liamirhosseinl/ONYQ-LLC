"use client";

import type { ReactNode } from "react";
import type { ServiceId } from "@/data/services.ts";
import { useBrief } from "./BriefProvider.tsx";

/** Any CTA that starts the brief. Server components render this with a label. */
export function OpenBriefButton({
  children,
  className = "btn btn--accent",
  serviceId,
  ariaLabel,
  magnetic = false,
}: {
  children: ReactNode;
  className?: string;
  serviceId?: ServiceId;
  ariaLabel?: string;
  magnetic?: boolean;
}) {
  const { open } = useBrief();
  return (
    <button type="button" className={className} onClick={() => open({ serviceId })} aria-label={ariaLabel} aria-haspopup="dialog" data-magnetic={magnetic ? "0.25" : undefined}>
      {children}
    </button>
  );
}
