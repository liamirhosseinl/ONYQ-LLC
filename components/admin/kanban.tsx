"use client";

import { useOptimistic, useTransition, useState } from "react";
import Link from "next/link";

type Card = { id: number; title: string; client: string; clientId: number; value: number; stage: string; recurring: boolean; close: string | null };

const LABEL: Record<string, string> = { new: "New", discovery: "Discovery", proposal: "Proposal", negotiation: "Negotiation", won: "Won", lost: "Lost" };

/** Drag a deal to another column (or use its stage menu — keyboard friendly). */
export function Kanban({ stages, cards, move, canEdit }: { stages: readonly string[]; cards: Card[]; move: (form: FormData) => Promise<void>; canEdit: boolean }) {
  const [items, setOptimistic] = useOptimistic(cards, (state, upd: { id: number; stage: string }) => state.map((c) => (c.id === upd.id ? { ...c, stage: upd.stage } : c)));
  const [, start] = useTransition();
  const [over, setOver] = useState<string | null>(null);
  const send = (id: number, stage: string) => {
    start(async () => {
      setOptimistic({ id, stage });
      const f = new FormData();
      f.set("id", String(id));
      f.set("stage", stage);
      await move(f);
    });
  };
  const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
  return (
    <div className="a-kanban">
      {stages.map((s) => {
        const col = items.filter((c) => c.stage === s);
        const total = col.reduce((t, c) => t + c.value, 0);
        return (
          <section
            key={s}
            className={`a-kanban__col a-kanban__col--${s}${over === s ? " is-over" : ""}`}
            onDragOver={(e) => {
              if (!canEdit) return;
              e.preventDefault();
              setOver(s);
            }}
            onDragLeave={() => setOver((o) => (o === s ? null : o))}
            onDrop={(e) => {
              setOver(null);
              const id = Number(e.dataTransfer.getData("text/deal"));
              if (id) send(id, s);
            }}
            aria-label={LABEL[s]}
          >
            <header className="a-kanban__head">
              <span className={`a-kanban__dot a-kanban__dot--${s}`} />
              <b>{LABEL[s]}</b>
              <span className="a-kanban__count">{col.length}</span>
              <span className="a-kanban__sum">{usd(total)}</span>
            </header>
            <div className="a-kanban__cards">
              {col.map((c) => (
                <article
                  key={c.id}
                  className="a-deal"
                  draggable={canEdit}
                  onDragStart={(e) => e.dataTransfer.setData("text/deal", String(c.id))}
                >
                  <Link href={`/admin/clients/${c.clientId}`} className="a-deal__title">
                    {c.title}
                  </Link>
                  <p className="a-deal__client">{c.client}</p>
                  <div className="a-deal__foot">
                    <b>{usd(c.value)}</b>
                    {c.recurring ? <span className="a-chip">monthly</span> : null}
                    {canEdit ? (
                      <select className="a-select a-select--compact" aria-label="Move to stage" value={c.stage} onChange={(e) => send(c.id, e.target.value)}>
                        {stages.map((x) => (
                          <option key={x} value={x}>
                            {LABEL[x]}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </article>
              ))}
              {col.length === 0 ? <p className="a-kanban__empty">Drop a deal here</p> : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
