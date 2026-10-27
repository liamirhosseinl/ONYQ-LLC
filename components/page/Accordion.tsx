"use client";

import { useId, useState, type ReactNode } from "react";
import { Plus } from "@/components/ui/icons.tsx";

export interface AccordionEntry {
  id: string;
  question: string;
  answer: ReactNode;
}

/** FAQ accordion: buttons with aria-expanded/aria-controls, keyboard and touch friendly. */
export function Accordion({ items, headingLevel = 3 }: { items: AccordionEntry[]; headingLevel?: 2 | 3 | 4 }) {
  const [open, setOpen] = useState<string | null>(null);
  const uid = useId();
  const H = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <div className="accordion">
      {items.map((item) => {
        const isOpen = open === item.id;
        const panelId = `${uid}-${item.id}-panel`;
        const btnId = `${uid}-${item.id}-btn`;
        return (
          <div key={item.id} className="accordion__item" id={item.id}>
            <H className="accordion__heading">
              <button
                type="button"
                id={btnId}
                className="accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
              >
                <span>{item.question}</span>
                <Plus size={18} />
              </button>
            </H>
            <div id={panelId} role="region" aria-labelledby={btnId} className="accordion__panel" data-open={isOpen ? "true" : "false"}>
              <div inert={!isOpen ? true : undefined}>
                <div className="accordion__answer">{item.answer}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
