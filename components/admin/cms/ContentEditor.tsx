"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { deepEqual, getAt, hashText, isPlainObject, pathKey, setAt, type Json, type Path } from "@/lib/cms/merge.ts";
import { FIXED_LENGTH_KEYS, LINK_KEYS, READ_ONLY_KEYS, REFERENCE_KEYS, humanKey, isLongText } from "@/lib/cms/registry.ts";
import { discardContent, publishContent, resetContent, restoreContentVersion, saveContent, type CmsResult } from "@/app/admin/cms-actions.ts";

/**
 * Generic content editor: renders a form from the shape of the code default, so every text
 * in a document can be edited without a hand-made form per page.
 *  - Russian/Armenian: the English text is shown under each field; a field is flagged when
 *    its English changed after it was translated.
 *  - Lists can grow and shrink unless their length is part of the design.
 *  - Save draft → preview on the site → publish (admins). History restores any version.
 */

type Option = { value: string; label: string };

interface Ctx {
  value: Json;
  set: (path: Path, v: unknown) => void;
  locale: string;
  defaults: Json | null;
  en: { value: Json; defaults: Json | null } | null;
  basis: Record<string, string>;
  ack: Set<string>;
  toggleAck: (k: string) => void;
  readOnly: boolean;
  query: string;
  onlyOutdated: boolean;
  references: Record<string, Option[]>;
  errorAt: { key: string; message: string } | null;
  messages: boolean;
}

const EditorCtx = createContext<Ctx | null>(null);
const useEditor = () => useContext(EditorCtx)!;

function isOutdated(ctx: Ctx, path: Path): boolean {
  if (!ctx.en) return false;
  const cur = getAt(ctx.en.value, path);
  if (typeof cur !== "string") return false;
  const k = pathKey(path);
  if (ctx.ack.has(k)) return false;
  const ref = ctx.basis[k] ?? (typeof getAt(ctx.en.defaults, path) === "string" ? hashText(getAt(ctx.en.defaults, path) as string) : undefined);
  return ref !== undefined && ref !== hashText(cur);
}

/** An empty copy of a list item, used as the template for "Add item". */
function blank(v: unknown): Json {
  if (typeof v === "string") return "";
  if (Array.isArray(v)) return [];
  if (isPlainObject(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, READ_ONLY_KEYS.has(k) ? (x as Json) : blank(x)]));
  return (v ?? null) as Json;
}

function preview(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(preview).find(Boolean) ?? "";
  if (isPlainObject(v)) {
    for (const k of ["title", "q", "name", "label", "tab", "text", "body"]) {
      const p = preview(v[k]);
      if (p) return p;
    }
    return Object.values(v).map(preview).find(Boolean) ?? "";
  }
  return "";
}

function matches(ctx: Ctx, path: Path, text: string): boolean {
  if (ctx.onlyOutdated && !isOutdated(ctx, path)) return false;
  if (!ctx.query) return true;
  const q = ctx.query.toLowerCase();
  const en = ctx.en ? getAt(ctx.en.value, path) : "";
  return text.toLowerCase().includes(q) || (typeof en === "string" && en.toLowerCase().includes(q)) || pathKey(path).toLowerCase().includes(q);
}

/* ───────── Fields ───────── */

function TextField({ path, label }: { path: Path; label: string }) {
  const ctx = useEditor();
  const value = (getAt(ctx.value, path) as string) ?? "";
  const def = getAt(ctx.defaults, path);
  const en = ctx.en ? getAt(ctx.en.value, path) : undefined;
  const key = path[path.length - 1];
  const k = pathKey(path);
  const id = `f-${k}`;
  const outdated = isOutdated(ctx, path);
  const changed = typeof def === "string" ? def !== value : value !== "";
  const err = ctx.errorAt?.key === k ? ctx.errorAt.message : null;
  if (!matches(ctx, path, value)) return null;

  if (typeof key === "string" && READ_ONLY_KEYS.has(key)) {
    return (
      <div className="a-cms-field a-cms-field--ro">
        <span className="a-cms-label">{label}</span>
        <code className="a-code">{value}</code>
      </div>
    );
  }
  const long = isLongText(key, typeof def === "string" ? def : value) || value.includes("\n");
  const rows = Math.min(14, Math.max(2, Math.ceil(value.length / 80) + value.split("\n").length - 1));
  const isLink = typeof key === "string" && LINK_KEYS.has(key);

  return (
    <div className="a-cms-field" id={id} data-changed={changed || undefined} data-outdated={outdated || undefined} data-error={err ? true : undefined}>
      <label className="a-cms-label" htmlFor={`${id}-in`}>
        {label}
        {changed ? <span className="a-cms-flag">edited</span> : null}
        {outdated ? <span className="a-cms-flag a-cms-flag--warn">English changed — check</span> : null}
        {isLink ? <span className="a-cms-flag a-cms-flag--muted">link</span> : null}
      </label>
      {long ? (
        <textarea
          id={`${id}-in`}
          className="a-cms-input"
          rows={rows}
          value={value}
          readOnly={ctx.readOnly}
          dir="auto"
          onChange={(e) => ctx.set(path, e.target.value)}
        />
      ) : (
        <input id={`${id}-in`} className="a-cms-input" value={value} readOnly={ctx.readOnly} dir="auto" onChange={(e) => ctx.set(path, e.target.value)} />
      )}
      {typeof en === "string" && ctx.locale !== "en" ? (
        <p className="a-cms-en">
          <span>EN</span>
          {en || <em>(empty)</em>}
        </p>
      ) : null}
      {err ? (
        <p className="a-msg a-msg--error" role="alert">
          {err}
        </p>
      ) : null}
      {!ctx.readOnly ? (
        <div className="a-cms-tools">
          {changed && typeof def === "string" ? (
            <button type="button" className="a-linkbtn" onClick={() => ctx.set(path, def)} title={def}>
              Reset to original
            </button>
          ) : null}
          {typeof en === "string" && ctx.locale !== "en" && en !== value ? (
            <button type="button" className="a-linkbtn" onClick={() => ctx.set(path, en)}>
              Copy English
            </button>
          ) : null}
          {outdated ? (
            <button type="button" className="a-linkbtn" onClick={() => ctx.toggleAck(k)}>
              Still correct
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function NumberField({ path, label }: { path: Path; label: string }) {
  const ctx = useEditor();
  const value = getAt(ctx.value, path) as number;
  if (!matches(ctx, path, String(value))) return null;
  const key = path[path.length - 1];
  if (typeof key === "string" && READ_ONLY_KEYS.has(key)) return null;
  return (
    <div className="a-cms-field a-cms-field--num" id={`f-${pathKey(path)}`}>
      <label className="a-cms-label" htmlFor={`f-${pathKey(path)}-in`}>
        {label}
      </label>
      <input
        id={`f-${pathKey(path)}-in`}
        className="a-cms-input"
        type="number"
        step="any"
        value={Number.isFinite(value) ? value : 0}
        readOnly={ctx.readOnly}
        onChange={(e) => ctx.set(path, e.target.value === "" ? 0 : Number(e.target.value))}
      />
    </div>
  );
}

function BoolField({ path, label }: { path: Path; label: string }) {
  const ctx = useEditor();
  const value = Boolean(getAt(ctx.value, path));
  if (ctx.query || ctx.onlyOutdated) return null;
  return (
    <label className="a-cms-check">
      <input type="checkbox" checked={value} disabled={ctx.readOnly} onChange={(e) => ctx.set(path, e.target.checked)} /> {label}
    </label>
  );
}

function ReferenceList({ path, label, kind }: { path: Path; label: string; kind: string }) {
  const ctx = useEditor();
  const value = (getAt(ctx.value, path) as string[]) ?? [];
  const options = ctx.references[kind] ?? [];
  if (ctx.query || ctx.onlyOutdated) return null;
  const known = new Set(options.map((o) => o.value));
  return (
    <fieldset className="a-cms-field a-cms-refs" id={`f-${pathKey(path)}`}>
      <legend className="a-cms-label">
        {label} <span className="a-cms-flag a-cms-flag--muted">links to {kind === "service" ? "services" : "pages"}</span>
      </legend>
      <div className="a-cms-chips">
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <label key={o.value} className="a-cms-chip" data-on={on || undefined}>
              <input
                type="checkbox"
                checked={on}
                disabled={ctx.readOnly}
                onChange={() => ctx.set(path, on ? value.filter((v) => v !== o.value) : [...value, o.value])}
              />
              {o.label}
            </label>
          );
        })}
        {value
          .filter((v) => !known.has(v))
          .map((v) => (
            <span key={v} className="a-cms-chip" data-on>
              {v} (removed)
            </span>
          ))}
      </div>
    </fieldset>
  );
}

function ListControls({ path, index, length, canMove }: { path: Path; index: number; length: number; canMove: boolean }) {
  const ctx = useEditor();
  if (ctx.readOnly) return null;
  const list = getAt(ctx.value, path) as Json[];
  const move = (to: number) => {
    const copy = list.slice();
    const [x] = copy.splice(index, 1);
    copy.splice(to, 0, x);
    ctx.set(path, copy);
  };
  return (
    <span className="a-cms-itemtools">
      {canMove ? (
        <>
          <button type="button" className="a-iconbtn a-iconbtn--s" aria-label="Move up" disabled={index === 0} onClick={() => move(index - 1)}>
            ↑
          </button>
          <button type="button" className="a-iconbtn a-iconbtn--s" aria-label="Move down" disabled={index === length - 1} onClick={() => move(index + 1)}>
            ↓
          </button>
          <button type="button" className="a-iconbtn a-iconbtn--s" aria-label="Duplicate" onClick={() => ctx.set(path, [...list.slice(0, index + 1), list[index], ...list.slice(index + 1)])}>
            ⧉
          </button>
          <button type="button" className="a-iconbtn a-iconbtn--s a-iconbtn--danger" aria-label="Remove" onClick={() => ctx.set(path, list.filter((_, i) => i !== index))}>
            ✕
          </button>
        </>
      ) : null}
    </span>
  );
}

function ListField({ path, label }: { path: Path; label: string }) {
  const ctx = useEditor();
  const list = (getAt(ctx.value, path) as Json[]) ?? [];
  const def = getAt(ctx.defaults, path) as Json[] | undefined;
  const enList = ctx.en ? (getAt(ctx.en.value, path) as Json[] | undefined) : undefined;
  const key = path[path.length - 1];
  const sample = list[0] ?? def?.[0] ?? enList?.[0];
  const ofObjects = isPlainObject(sample);
  // Items tied to a picture or a tab (they have a "key"/"slug") keep their number and order.
  const designBound = ofObjects && ("key" in (sample as object) || "slug" in (sample as object));
  const fixed = (typeof key === "string" && FIXED_LENGTH_KEYS.has(key)) || designBound;
  const missing = enList && enList.length > list.length ? enList.length - list.length : 0;

  if (typeof key === "string" && REFERENCE_KEYS[key] && (sample === undefined || typeof sample === "string")) {
    return <ReferenceList path={path} label={label} kind={REFERENCE_KEYS[key]} />;
  }

  const add = () => ctx.set(path, [...list, blank(sample ?? "")]);

  return (
    <fieldset className="a-cms-group a-cms-list" id={`f-${pathKey(path)}`}>
      <legend className="a-cms-legend">
        {label} <span className="a-muted">({list.length})</span>
      </legend>
      {missing && !ctx.readOnly ? (
        <p className="a-cms-note">
          English has {enList!.length} items here, this language {list.length}.{" "}
          <button type="button" className="a-linkbtn" onClick={() => ctx.set(path, [...list, ...enList!.slice(list.length)])}>
            Copy the missing {missing} from English
          </button>
        </p>
      ) : null}
      {list.map((item, i) =>
        ofObjects ? (
          <details key={i} className="a-cms-item" open={list.length <= 4 || Boolean(ctx.query) || ctx.onlyOutdated}>
            <summary>
              <span className="a-cms-item__n">{String(i + 1).padStart(2, "0")}</span>
              <span className="a-cms-item__title">{preview(item) || <em>empty</em>}</span>
              <ListControls path={path} index={i} length={list.length} canMove={!fixed} />
            </summary>
            <ObjectFields path={[...path, i]} />
          </details>
        ) : typeof item === "string" ? (
          <div key={i} className="a-cms-row">
            <TextField path={[...path, i]} label={`${label} ${i + 1}`} />
            <ListControls path={path} index={i} length={list.length} canMove={!fixed} />
          </div>
        ) : (
          <Node key={i} path={[...path, i]} label={`#${i + 1}`} />
        ),
      )}
      {!fixed && !ctx.readOnly ? (
        <button type="button" className="a-btn a-btn--small a-cms-add" onClick={add}>
          + Add {ofObjects ? "item" : "line"}
        </button>
      ) : null}
    </fieldset>
  );
}

function ObjectFields({ path }: { path: Path }) {
  const ctx = useEditor();
  const obj = getAt(ctx.value, path);
  if (!isPlainObject(obj)) return null;
  return (
    <div className="a-cms-fields">
      {Object.keys(obj).map((k) => (
        <Node key={k} path={[...path, k]} label={humanKey(k)} />
      ))}
    </div>
  );
}

function Node({ path, label }: { path: Path; label: string }) {
  const ctx = useEditor();
  const v = getAt(ctx.value, path);
  if (typeof v === "string") return <TextField path={path} label={label} />;
  if (typeof v === "number") return <NumberField path={path} label={label} />;
  if (typeof v === "boolean") return <BoolField path={path} label={label} />;
  if (Array.isArray(v)) return <ListField path={path} label={label} />;
  if (isPlainObject(v)) {
    return (
      <fieldset className="a-cms-group">
        <legend className="a-cms-legend">{label}</legend>
        <ObjectFields path={path} />
      </fieldset>
    );
  }
  return null;
}

/* ───────── Editor ───────── */

export function ContentEditor(props: {
  docKey: string;
  locale: string;
  sitePath: string;
  defaults: Json | null;
  value: Json;
  hasDraft: boolean;
  draftInfo: string | null;
  en: { value: Json; defaults: Json | null } | null;
  basis: Record<string, string>;
  canEdit: boolean;
  canPublish: boolean;
  references: Record<string, Option[]>;
  history: { id: number; when: string; by: string; note: string | null }[];
  messages: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Json>(props.value);
  const [saved, setSaved] = useState<Json>(props.value);
  const [ack, setAck] = useState<Set<string>>(new Set());
  const [hasDraft, setHasDraft] = useState(props.hasDraft);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [errorAt, setErrorAt] = useState<{ key: string; message: string } | null>(null);
  const [query, setQuery] = useState("");
  const [onlyOutdated, setOnlyOutdated] = useState(false);
  const dirty = !deepEqual(value, saved) || ack.size > 0;

  // After a restore, reset or publish the server sends new data: take it unless the editor
  // holds unsaved changes.
  const incoming = useRef(props.value);
  useEffect(() => {
    if (deepEqual(incoming.current, props.value)) return;
    incoming.current = props.value;
    setHasDraft(props.hasDraft);
    if (deepEqual(value, saved)) {
      setValue(props.value);
      setSaved(props.value);
    }
  }, [props.value, props.hasDraft, value, saved]);

  const set = useCallback((path: Path, v: unknown) => {
    setValue((cur) => setAt(cur, path, v));
    setErrorAt(null);
  }, []);
  const toggleAck = useCallback((k: string) => setAck((s) => new Set(s).add(k)), []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const outdatedCount = useMemo(() => {
    if (!props.en) return 0;
    const c: Ctx = { value, set, locale: props.locale, defaults: props.defaults, en: props.en, basis: props.basis, ack, toggleAck, readOnly: true, query: "", onlyOutdated: false, references: {}, errorAt: null, messages: props.messages };
    let n = 0;
    const walk = (v: unknown, p: Path) => {
      if (typeof v === "string") n += isOutdated(c, p) ? 1 : 0;
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, [...p, i]));
      else if (isPlainObject(v)) Object.entries(v).forEach(([k, x]) => walk(x, [...p, k]));
    };
    walk(value, []);
    return n;
  }, [value, props.en, props.locale, props.defaults, props.basis, ack, set, toggleAck, props.messages]);

  const handle = (r: CmsResult) => {
    if (r.ok) {
      setMsg({ ok: true, text: r.message ?? "Saved." });
      if (r.hasDraft !== undefined) setHasDraft(r.hasDraft);
      setErrorAt(null);
      return true;
    }
    setMsg({ ok: false, text: r.error });
    if (r.path?.length) {
      const k = pathKey(r.path);
      setErrorAt({ key: k, message: r.error });
      requestAnimationFrame(() => document.getElementById(`f-${k}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
    return false;
  };

  const save = async (publish: boolean) => {
    setBusy(publish ? "publish" : "save");
    try {
      const r = await saveContent(props.docKey, props.locale, JSON.stringify(value), publish, [...ack]);
      if (handle(r)) {
        setSaved(value);
        setAck(new Set());
        router.refresh();
      }
      return r.ok;
    } finally {
      setBusy(null);
    }
  };

  // Ctrl/Cmd + S saves the draft.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (props.canEdit) void saveRef.current(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.canEdit]);

  const openPreview = async () => {
    const w = window.open("about:blank", "_blank");
    if (dirty && props.canEdit) {
      const ok = await save(false);
      if (!ok) {
        w?.close();
        return;
      }
    }
    const url = `/admin/preview?mode=on&next=${encodeURIComponent(props.sitePath)}`;
    if (w) w.location.href = url;
    else window.location.href = url;
  };

  const ctx: Ctx = {
    value,
    set,
    locale: props.locale,
    defaults: props.defaults,
    en: props.en,
    basis: props.basis,
    ack,
    toggleAck,
    readOnly: !props.canEdit,
    query,
    onlyOutdated,
    references: props.references,
    errorAt,
    messages: props.messages,
  };

  const top = isPlainObject(value) ? Object.keys(value) : [];

  return (
    <EditorCtx.Provider value={ctx}>
      <div className="a-cms-editor">
        <div className="a-cms-filter">
          <input type="search" placeholder="Find a text…" aria-label="Find a text" value={query} onChange={(e) => setQuery(e.target.value)} className="a-cms-input" />
          {props.en ? (
            <label className="a-cms-check">
              <input type="checkbox" checked={onlyOutdated} onChange={(e) => setOnlyOutdated(e.target.checked)} /> Only fields whose English changed ({outdatedCount})
            </label>
          ) : null}
          {props.messages ? (
            <p className="a-muted a-small">Keep words in curly braces like {"{count}"} and tags like {"<b>…</b>"} exactly as they are — the site fills them in.</p>
          ) : null}
        </div>

        {top.map((k, i) => {
          const v = (value as Record<string, Json>)[k];
          const isGroup = isPlainObject(v) || (Array.isArray(v) && v.some((x) => isPlainObject(x)));
          return isGroup ? (
            <details key={k} className="a-cms-section" open={i < 2 || Boolean(query) || onlyOutdated}>
              <summary>{humanKey(k)}</summary>
              {Array.isArray(v) ? <ListField path={[k]} label={humanKey(k)} /> : <ObjectFields path={[k]} />}
            </details>
          ) : (
            <div key={k} className="a-cms-section a-cms-section--flat">
              <Node path={[k]} label={humanKey(k)} />
            </div>
          );
        })}
        {Array.isArray(value) ? <ListField path={[]} label="Items" /> : null}

        <section className="a-cms-history">
          <details>
            <summary>History ({props.history.length})</summary>
            {props.history.length ? (
              <ul>
                {props.history.map((h, i) => (
                  <li key={h.id}>
                    <span>
                      {i === 0 ? <b>Live · </b> : null}
                      Published {h.when} by {h.by}
                      {h.note ? ` — ${h.note}` : ""}
                    </span>
                    {props.canPublish && i > 0 ? (
                      <button
                        type="button"
                        className="a-btn a-btn--small"
                        disabled={Boolean(busy)}
                        onClick={async () => {
                          setBusy("restore");
                          const r = await restoreContentVersion(h.id);
                          setBusy(null);
                          if (handle(r)) router.refresh();
                        }}
                      >
                        Restore as draft
                      </button>
                    ) : null}
                  </li>
                ))}
                <li>
                  <span className="a-muted">Original text (as shipped with the site)</span>
                  {props.canEdit ? (
                    <button
                      type="button"
                      className="a-btn a-btn--small"
                      disabled={Boolean(busy)}
                      onClick={async () => {
                        setBusy("restore");
                        const r = await resetContent(props.docKey, props.locale);
                        setBusy(null);
                        if (handle(r)) router.refresh();
                      }}
                    >
                      Restore as draft
                    </button>
                  ) : null}
                </li>
              </ul>
            ) : (
              <p className="a-muted a-small">Not published from the panel yet — the site shows the original text.</p>
            )}
          </details>
        </section>
      </div>

      <div className="a-cms-bar" role="region" aria-label="Save and publish">
        <span className="a-cms-bar__state">
          {dirty ? <b className="a-cms-unsaved">Unsaved changes</b> : hasDraft ? <span>{props.draftInfo ?? "Draft saved"} · not published</span> : <span className="a-muted">Up to date with the website</span>}
        </span>
        {msg ? (
          <span className={msg.ok ? "a-cms-bar__ok" : "a-cms-bar__err"} role={msg.ok ? "status" : "alert"}>
            {msg.text}
          </span>
        ) : null}
        <span className="a-cms-bar__actions">
          <button type="button" className="a-btn" onClick={openPreview} disabled={Boolean(busy)}>
            Preview ↗
          </button>
          {props.canEdit ? (
            <>
              {hasDraft && !dirty ? (
                <button
                  type="button"
                  className="a-btn a-btn--ghost-danger"
                  disabled={Boolean(busy)}
                  onClick={async () => {
                    setBusy("discard");
                    const r = await discardContent(props.docKey, props.locale);
                    setBusy(null);
                    if (handle(r)) router.refresh();
                  }}
                >
                  Discard draft
                </button>
              ) : null}
              <button
                type="button"
                className="a-btn"
                disabled={Boolean(busy)}
                title="Reset every field of this document to the original text (as a draft)"
                onClick={async () => {
                  setBusy("reset");
                  const r = await resetContent(props.docKey, props.locale);
                  setBusy(null);
                  if (handle(r)) router.refresh();
                }}
              >
                Reset all
              </button>
              <button type="button" className="a-btn" disabled={Boolean(busy) || !dirty} onClick={() => save(false)}>
                {busy === "save" ? "Saving…" : "Save draft"}
              </button>
              {props.canPublish ? (
                <button
                  type="button"
                  className="a-btn a-btn--primary"
                  disabled={Boolean(busy) || (!dirty && !hasDraft)}
                  onClick={async () => {
                    if (dirty) await save(true);
                    else {
                      setBusy("publish");
                      const r = await publishContent(props.docKey, props.locale);
                      setBusy(null);
                      if (handle(r)) router.refresh();
                    }
                  }}
                >
                  {busy === "publish" ? "Publishing…" : "Publish"}
                </button>
              ) : null}
            </>
          ) : (
            <span className="a-muted a-small">View only — ask an admin for editing rights.</span>
          )}
        </span>
      </div>
    </EditorCtx.Provider>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="a-cms-section" open>
      <summary>{title}</summary>
      {children}
    </details>
  );
}
