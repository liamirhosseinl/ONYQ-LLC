"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deepEqual } from "@/lib/cms/merge.ts";
import { discardContent, publishContent, saveServicesDraft, type CmsResult } from "@/app/admin/cms-actions.ts";
import type { ServiceEntry } from "@/lib/server/cms.ts";

type Copy = { name: string; short: string };
type NewCopy = Record<string, { en: Copy; ru: Copy; hy: Copy }>;

const EMPTY_COPY = { en: { name: "", short: "" }, ru: { name: "", short: "" }, hy: { name: "", short: "" } };

/** Table editor for the price list: price, billing, timeline, category, order, visibility. */
export function ServicesEditor(props: {
  value: ServiceEntry[];
  hasDraft: boolean;
  names: Record<string, Copy>;
  categories: { id: string; label: string }[];
  codeIds: string[];
  canEdit: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [list, setList] = useState<ServiceEntry[]>(props.value);
  const [saved, setSaved] = useState<ServiceEntry[]>(props.value);
  const [newCopy, setNewCopy] = useState<NewCopy>({});
  const [hasDraft, setHasDraft] = useState(props.hasDraft);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [adding, setAdding] = useState<{ id: string; category: string; copy: typeof EMPTY_COPY } | null>(null);
  const dirty = !deepEqual(list, saved) || Object.keys(newCopy).length > 0;
  const ro = !props.canEdit;

  // Fresh data from the server (after discard or publish) replaces an unchanged list.
  const incoming = useRef(props.value);
  useEffect(() => {
    if (deepEqual(incoming.current, props.value)) return;
    incoming.current = props.value;
    setHasDraft(props.hasDraft);
    if (deepEqual(list, saved)) {
      setList(props.value);
      setSaved(props.value);
    }
  }, [props.value, props.hasDraft, list, saved]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (i: number, patch: Partial<ServiceEntry>) => setList((l) => l.map((s, j) => (j === i ? ({ ...s, ...patch } as ServiceEntry) : s)));
  const move = (i: number, d: number) =>
    setList((l) => {
      const c = l.slice();
      const [x] = c.splice(i, 1);
      c.splice(i + d, 0, x);
      return c;
    });

  const handle = (r: CmsResult) => {
    setMsg(r.ok ? { ok: true, text: r.message ?? "Saved." } : { ok: false, text: r.error });
    if (r.ok && r.hasDraft !== undefined) setHasDraft(r.hasDraft);
    return r.ok;
  };

  const save = async (publish: boolean) => {
    setBusy(true);
    const r = await saveServicesDraft(JSON.stringify(list), JSON.stringify(newCopy), publish);
    setBusy(false);
    if (handle(r)) {
      setSaved(list);
      setNewCopy({});
      router.refresh();
    }
  };

  const name = (id: string) => newCopy[id]?.en.name || props.names[id]?.name || id;

  return (
    <>
      <div className="a-card a-card--flush">
        <div className="a-cms-svc a-cms-svc--head" aria-hidden="true">
          <span />
          <span>Service</span>
          <span>Category</span>
          <span>Price (USD)</span>
          <span>Billing</span>
          <span>Timeline</span>
          <span />
        </div>
        {list.map((s, i) => (
          <div key={s.id} className="a-cms-svc" data-hidden={s.hidden || undefined}>
            <span className="a-muted a-small">{String(i + 1).padStart(2, "0")}</span>
            <span className="a-cms-svc__name">
              <b>{name(s.id)}</b>
              <small>{s.id}</small>
            </span>
            <select className="a-select" aria-label={`Category of ${name(s.id)}`} value={s.category} disabled={ro} onChange={(e) => update(i, { category: e.target.value as ServiceEntry["category"] })}>
              {props.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              step={1}
              aria-label={`Price of ${name(s.id)}`}
              value={s.regularPriceUsd}
              readOnly={ro}
              onChange={(e) => update(i, { regularPriceUsd: Math.max(0, Number(e.target.value) || 0) })}
            />
            <select
              className="a-select"
              aria-label={`Billing of ${name(s.id)}`}
              value={s.billingType}
              disabled={ro}
              onChange={(e) => {
                const billingType = e.target.value as ServiceEntry["billingType"];
                update(i, { billingType, timeline: billingType === "monthly" ? { kind: "monthly" } : s.timeline.kind === "monthly" ? { kind: "weeks", from: 2 } : s.timeline });
              }}
            >
              <option value="one_time">One-time</option>
              <option value="monthly">Monthly</option>
            </select>
            {s.timeline.kind === "monthly" ? (
              <span className="a-muted a-small">ongoing</span>
            ) : (
              <span className="a-cms-inline">
                <input
                  type="number"
                  min={1}
                  max={120}
                  aria-label={`Timeline of ${name(s.id)}`}
                  value={s.timeline.from}
                  readOnly={ro}
                  style={{ width: 70 }}
                  onChange={(e) => update(i, { timeline: { kind: (s.timeline as { kind: "days" }).kind, from: Math.max(1, Number(e.target.value) || 1) } })}
                />
                <select
                  className="a-select"
                  aria-label={`Timeline unit of ${name(s.id)}`}
                  value={s.timeline.kind}
                  disabled={ro}
                  onChange={(e) => update(i, { timeline: { kind: e.target.value as "days", from: (s.timeline as { from: number }).from } })}
                >
                  <option value="days">days</option>
                  <option value="weeks">weeks</option>
                  <option value="months">months</option>
                </select>
              </span>
            )}
            <span className="a-cms-svc__tools">
              <label className="a-cms-check a-small" title="Shown in “Most requested”">
                <input type="checkbox" checked={Boolean(s.featured)} disabled={ro} onChange={(e) => update(i, { featured: e.target.checked || undefined })} /> top
              </label>
              <label className="a-cms-check a-small">
                <input type="checkbox" checked={!s.hidden} disabled={ro} onChange={(e) => update(i, { hidden: e.target.checked ? undefined : true })} /> visible
              </label>
              {!ro ? (
                <>
                  <button type="button" className="a-iconbtn a-iconbtn--s" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    ↑
                  </button>
                  <button type="button" className="a-iconbtn a-iconbtn--s" aria-label="Move down" disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                    ↓
                  </button>
                  {!props.codeIds.includes(s.id) ? (
                    <button
                      type="button"
                      className="a-iconbtn a-iconbtn--s a-iconbtn--danger"
                      aria-label={`Delete ${name(s.id)}`}
                      onClick={() => {
                        setList((l) => l.filter((x) => x.id !== s.id));
                        setNewCopy((c) => {
                          const n = { ...c };
                          delete n[s.id];
                          return n;
                        });
                      }}
                    >
                      ✕
                    </button>
                  ) : null}
                </>
              ) : null}
            </span>
            <details className="a-cms-more" style={{ gridColumn: "2 / -1" }}>
              <summary className="a-muted a-small">More: page link, ad budget note</summary>
              <div className="a-form__row" style={{ marginTop: 8 }}>
                <label className="a-field">
                  <span>Page the service links to</span>
                  <input value={s.detailPage} readOnly={ro} maxLength={200} onChange={(e) => update(i, { detailPage: e.target.value })} />
                </label>
                <label className="a-cms-check">
                  <input type="checkbox" checked={Boolean(s.thirdPartySpendSeparate)} disabled={ro} onChange={(e) => update(i, { thirdPartySpendSeparate: e.target.checked || undefined })} />
                  “Ad budget is paid separately” note
                </label>
              </div>
            </details>
          </div>
        ))}
      </div>

      {!ro ? (
        adding ? (
          <div className="a-card">
            <h2 className="a-card__title">New service</h2>
            <div className="a-form">
              <div className="a-form__row">
                <label className="a-field">
                  <span>ID (used in links; lowercase, digits, dashes)</span>
                  <input value={adding.id} maxLength={48} onChange={(e) => setAdding({ ...adding, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="e.g. video-editing" />
                </label>
                <label className="a-field">
                  <span>Category</span>
                  <select className="a-select" value={adding.category} onChange={(e) => setAdding({ ...adding, category: e.target.value })}>
                    {props.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {(["en", "ru", "hy"] as const).map((l) => (
                <div key={l} className="a-form__row">
                  <label className="a-field">
                    <span>Name — {l.toUpperCase()}</span>
                    <input value={adding.copy[l].name} maxLength={120} onChange={(e) => setAdding({ ...adding, copy: { ...adding.copy, [l]: { ...adding.copy[l], name: e.target.value } } })} />
                  </label>
                  <label className="a-field a-field--wide">
                    <span>Short description — {l.toUpperCase()}</span>
                    <input value={adding.copy[l].short} maxLength={300} onChange={(e) => setAdding({ ...adding, copy: { ...adding.copy, [l]: { ...adding.copy[l], short: e.target.value } } })} />
                  </label>
                </div>
              ))}
              <div className="a-form__row">
                <button
                  type="button"
                  className="a-btn a-btn--primary"
                  onClick={() => {
                    const id = adding.id.replace(/^-+|-+$/g, "");
                    if (!/^[a-z0-9][a-z0-9-]{1,48}$/.test(id)) return setMsg({ ok: false, text: "Choose an ID of at least 2 characters: lowercase letters, digits and dashes." });
                    if (list.some((s) => s.id === id)) return setMsg({ ok: false, text: "That ID is already used." });
                    if ((["en", "ru", "hy"] as const).some((l) => adding.copy[l].name.trim().length < 2))
                      return setMsg({ ok: false, text: "Give the service a name in all three languages (use English for the others if needed)." });
                    setList((l) => [
                      ...l,
                      { id: id as ServiceEntry["id"], category: adding.category as ServiceEntry["category"], regularPriceUsd: 100, billingType: "one_time", timeline: { kind: "weeks", from: 2 }, detailPage: "/price", promoEligible: true },
                    ]);
                    setNewCopy((c) => ({ ...c, [id]: adding.copy }));
                    setAdding(null);
                    setMsg({ ok: true, text: "Added at the end of the list — set its price, then save." });
                  }}
                >
                  Add to the list
                </button>
                <button type="button" className="a-btn" onClick={() => setAdding(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button type="button" className="a-btn" style={{ justifySelf: "start" }} onClick={() => setAdding({ id: "", category: props.categories[0].id, copy: structuredClone(EMPTY_COPY) })}>
            + Add a service
          </button>
        )
      ) : null}

      <div className="a-cms-bar" role="region" aria-label="Save and publish">
        <span className="a-cms-bar__state">
          {dirty ? <b className="a-cms-unsaved">Unsaved changes</b> : hasDraft ? <span>Draft saved · not published</span> : <span className="a-muted">Up to date with the website</span>}
        </span>
        {msg ? (
          <span className={msg.ok ? "a-cms-bar__ok" : "a-cms-bar__err"} role={msg.ok ? "status" : "alert"}>
            {msg.text}
          </span>
        ) : null}
        <span className="a-cms-bar__actions">
          <a className="a-btn" href="/admin/preview?mode=on&next=/price" target="_blank" rel="noopener">
            Preview ↗
          </a>
          {!ro ? (
            <>
              {hasDraft && !dirty ? (
                <button
                  type="button"
                  className="a-btn a-btn--ghost-danger"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const r = await discardContent("services", "*");
                    setBusy(false);
                    if (handle(r)) router.refresh();
                  }}
                >
                  Discard draft
                </button>
              ) : null}
              <button type="button" className="a-btn" disabled={busy || !dirty} onClick={() => save(false)}>
                Save draft
              </button>
              {props.canPublish ? (
                <button
                  type="button"
                  className="a-btn a-btn--primary"
                  disabled={busy || (!dirty && !hasDraft)}
                  onClick={async () => {
                    if (dirty) return save(true);
                    setBusy(true);
                    const r = await publishContent("services", "*");
                    setBusy(false);
                    if (handle(r)) router.refresh();
                  }}
                >
                  Publish
                </button>
              ) : null}
            </>
          ) : null}
        </span>
      </div>
    </>
  );
}
