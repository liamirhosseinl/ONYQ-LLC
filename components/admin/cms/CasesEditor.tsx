"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deepEqual } from "@/lib/cms/merge.ts";
import { discardContent, publishContent, saveCasesDraft, type CmsResult } from "@/app/admin/cms-actions.ts";
import type { CaseEntry } from "@/lib/server/cms.ts";
import { MediaPicker, type MediaItem } from "./MediaLibrary.tsx";

type Img = CaseEntry["cover"];
type Intro = { name: string; industry: string; teaser: string };

const DIRECTIONS = [
  ["design", "Design"],
  ["development", "Development"],
  ["mobile-apps", "Mobile apps"],
  ["ai", "AI"],
  ["marketing", "Marketing"],
  ["content", "Content & video"],
] as const;

function ImageRow({
  img,
  label,
  media,
  onChange,
  onRemove,
  onMove,
  readOnly,
  gallery,
  addMedia,
}: {
  img: Img;
  label: string;
  media: MediaItem[];
  onChange: (i: Img) => void;
  onRemove?: () => void;
  onMove?: (d: number) => void;
  readOnly: boolean;
  gallery?: boolean;
  addMedia: (m: MediaItem) => void;
}) {
  const [picking, setPicking] = useState<"image" | "video" | null>(null);
  return (
    <div className="a-cms-img">
      {/* Plain img: admin preview only. */}
      <img className="a-cms-img__thumb" src={img.src} alt="" />
      <div className="a-cms-img__fields">
        <span className="a-small">
          <b>{label}</b>
          <br />
          <span className="a-muted">
            {img.src.split("/").slice(-2).join("/")} · {img.width}×{img.height}
          </span>
        </span>
        {gallery ? (
          <>
            <label className="a-field">
              <span>Layout</span>
              <select className="a-select" value={img.span ?? ""} disabled={readOnly} onChange={(e) => onChange({ ...img, span: (e.target.value || undefined) as Img["span"] })}>
                <option value="">auto</option>
                <option value="full">full width</option>
                <option value="half">half</option>
                <option value="tall">tall</option>
                <option value="reel">phone / vertical</option>
              </select>
            </label>
            <label className="a-field">
              <span>Tile</span>
              <select className="a-select" value={img.tone ?? ""} disabled={readOnly} onChange={(e) => onChange({ ...img, tone: (e.target.value || undefined) as Img["tone"] })}>
                <option value="">auto</option>
                <option value="light">light</option>
                <option value="dark">dark</option>
              </select>
            </label>
          </>
        ) : null}
        <label className="a-field">
          <span>Alt-text key</span>
          <input value={img.alt} disabled={readOnly} maxLength={60} onChange={(e) => onChange({ ...img, alt: e.target.value.replace(/[^A-Za-z0-9-]/g, "") || "image" })} />
        </label>
        {img.video ? <span className="a-small a-muted">video: {img.video.split("/").pop()}</span> : null}
      </div>
      {!readOnly ? (
        <span className="a-cms-itemtools" style={{ flexWrap: "wrap" }}>
          <button type="button" className="a-btn a-btn--small" onClick={() => setPicking("image")}>
            Change image
          </button>
          {gallery ? (
            img.video ? (
              <button type="button" className="a-btn a-btn--small" onClick={() => onChange({ ...img, video: undefined })}>
                Remove video
              </button>
            ) : (
              <button type="button" className="a-btn a-btn--small" onClick={() => setPicking("video")}>
                Add video
              </button>
            )
          ) : null}
          {onMove ? (
            <>
              <button type="button" className="a-iconbtn a-iconbtn--s" aria-label="Move up" onClick={() => onMove(-1)}>
                ↑
              </button>
              <button type="button" className="a-iconbtn a-iconbtn--s" aria-label="Move down" onClick={() => onMove(1)}>
                ↓
              </button>
            </>
          ) : null}
          {onRemove ? (
            <button type="button" className="a-iconbtn a-iconbtn--s a-iconbtn--danger" aria-label="Remove" onClick={onRemove}>
              ✕
            </button>
          ) : null}
        </span>
      ) : null}
      {picking ? (
        <MediaPicker
          items={media}
          kind={picking}
          selected={picking === "image" ? img.src : img.video}
          onUploaded={addMedia}
          onClose={() => setPicking(null)}
          onPick={(m) => {
            if (picking === "image") onChange({ ...img, src: m.url, width: m.width ?? img.width, height: m.height ?? img.height });
            else onChange({ ...img, video: m.url, span: img.span ?? "reel" });
            setPicking(null);
          }}
        />
      ) : null}
    </div>
  );
}

function CaseCardEditor({
  c,
  isNew,
  media,
  services,
  readOnly,
  onChange,
  addMedia,
}: {
  c: CaseEntry;
  isNew: boolean;
  media: MediaItem[];
  services: { value: string; label: string }[];
  readOnly: boolean;
  onChange: (c: CaseEntry) => void;
  addMedia: (m: MediaItem) => void;
}) {
  const [pickGallery, setPickGallery] = useState(false);
  const set = (patch: Partial<CaseEntry>) => onChange({ ...c, ...patch });
  const gallery = c.gallery;
  const nextAlt = () => {
    let n = gallery.length + 1;
    while (gallery.some((g) => g.alt === `image${n}`)) n++;
    return `image${n}`;
  };
  return (
    <div className="a-form" style={{ padding: "4px 12px 16px" }}>
      {!isNew ? (
        <p className="a-small">
          Texts of this project:{" "}
          {(["en", "ru", "hy"] as const).map((l, i) => (
            <span key={l}>
              {i ? " · " : ""}
              <Link className="a-link" href={`/admin/content/edit?doc=${encodeURIComponent(`case:${c.slug}`)}&lang=${l}`}>
                {l.toUpperCase()}
              </Link>
            </span>
          ))}
          <span className="a-muted"> (name, story, results, image descriptions)</span>
        </p>
      ) : (
        <p className="a-cms-note">Save the project first, then open its texts to write the story in each language.</p>
      )}
      <div className="a-form__row">
        <label className="a-field">
          <span>Client name shown (empty = “under NDA”)</span>
          <input value={c.client ?? ""} disabled={readOnly} maxLength={120} onChange={(e) => set({ client: e.target.value || null })} />
        </label>
        <label className="a-field">
          <span>Website (https://…)</span>
          <input value={c.url ?? ""} disabled={readOnly} maxLength={300} placeholder="https://" onChange={(e) => set({ url: e.target.value || null })} />
        </label>
        <label className="a-field">
          <span>Year</span>
          <input type="number" min={2000} max={2100} value={c.year} disabled={readOnly} onChange={(e) => set({ year: Number(e.target.value) || c.year })} />
        </label>
        <label className="a-field">
          <span>Status</span>
          <select className="a-select" value={c.status ?? "live"} disabled={readOnly} onChange={(e) => set({ status: e.target.value as "live" | "preview" })}>
            <option value="live">Live on the client’s domain</option>
            <option value="preview">Preview · awaiting client approval</option>
          </select>
        </label>
      </div>
      <div className="a-form__row">
        <label className="a-field">
          <span>Accent colour</span>
          <input type="color" value={c.accent} disabled={readOnly} onChange={(e) => set({ accent: e.target.value.toUpperCase() })} />
        </label>
        <label className="a-field">
          <span>Text on accent</span>
          <input type="color" value={c.accentInk} disabled={readOnly} onChange={(e) => set({ accentInk: e.target.value.toUpperCase() })} />
        </label>
        <label className="a-field">
          <span>Headline number (empty = none)</span>
          <input
            type="number"
            value={c.metric?.value ?? ""}
            disabled={readOnly}
            onChange={(e) => set({ metric: e.target.value === "" ? undefined : { ...(c.metric ?? {}), value: Number(e.target.value) } })}
          />
        </label>
        <label className="a-field">
          <span>Number suffix (+, %, M+…)</span>
          <input value={c.metric?.suffix ?? ""} disabled={readOnly || !c.metric} maxLength={10} onChange={(e) => set({ metric: c.metric ? { ...c.metric, suffix: e.target.value || undefined } : undefined })} />
        </label>
        <label className="a-cms-check">
          <input type="checkbox" checked={c.showLogo} disabled={readOnly} onChange={(e) => set({ showLogo: e.target.checked })} /> Show client logo
        </label>
      </div>
      <fieldset className="a-cms-refs">
        <legend className="a-cms-label">Directions</legend>
        <div className="a-cms-chips">
          {DIRECTIONS.map(([id, label]) => {
            const on = c.directions.includes(id);
            return (
              <label key={id} className="a-cms-chip" data-on={on || undefined}>
                <input type="checkbox" checked={on} disabled={readOnly} onChange={() => set({ directions: on ? c.directions.filter((d) => d !== id) : [...c.directions, id] })} />
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="a-cms-refs">
        <legend className="a-cms-label">Services used (links to the price list)</legend>
        <div className="a-cms-chips">
          {services.map((o) => {
            const on = (c.services as string[]).includes(o.value);
            return (
              <label key={o.value} className="a-cms-chip" data-on={on || undefined}>
                <input
                  type="checkbox"
                  checked={on}
                  disabled={readOnly}
                  onChange={() => set({ services: (on ? c.services.filter((s) => s !== o.value) : [...c.services, o.value]) as CaseEntry["services"] })}
                />
                {o.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <ImageRow img={c.cover} label="Cover" media={media} readOnly={readOnly} addMedia={addMedia} onChange={(cover) => set({ cover })} />
      <p className="a-cms-label">Gallery ({gallery.length})</p>
      {gallery.map((g, i) => (
        <ImageRow
          key={`${g.src}-${i}`}
          img={g}
          label={`#${i + 1}`}
          gallery
          media={media}
          readOnly={readOnly}
          addMedia={addMedia}
          onChange={(img) => set({ gallery: gallery.map((x, j) => (j === i ? img : x)) })}
          onRemove={() => set({ gallery: gallery.filter((_, j) => j !== i) })}
          onMove={(d) => {
            const to = i + d;
            if (to < 0 || to >= gallery.length) return;
            const copy = gallery.slice();
            const [x] = copy.splice(i, 1);
            copy.splice(to, 0, x);
            set({ gallery: copy });
          }}
        />
      ))}
      {!readOnly ? (
        <button type="button" className="a-btn a-btn--small" style={{ justifySelf: "start" }} onClick={() => setPickGallery(true)}>
          + Add an image to the gallery
        </button>
      ) : null}
      {pickGallery ? (
        <MediaPicker
          items={media}
          kind="image"
          onUploaded={addMedia}
          onClose={() => setPickGallery(false)}
          onPick={(m) => {
            const tall = (m.height ?? 0) > (m.width ?? 0);
            set({ gallery: [...gallery, { src: m.url, width: m.width ?? 2000, height: m.height ?? 1250, alt: nextAlt(), ...(tall ? { span: "reel" as const } : {}) }] });
            setPickGallery(false);
          }}
        />
      ) : null}
    </div>
  );
}

export function CasesEditor(props: {
  value: CaseEntry[];
  hasDraft: boolean;
  names: Record<string, string>;
  codeSlugs: string[];
  media: MediaItem[];
  services: { value: string; label: string }[];
  canEdit: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [list, setList] = useState<CaseEntry[]>(props.value);
  const [saved, setSaved] = useState<CaseEntry[]>(props.value);
  const [intros, setIntros] = useState<Record<string, Intro>>({});
  const [media, setMedia] = useState<MediaItem[]>(props.media);
  const [open, setOpen] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(props.hasDraft);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [adding, setAdding] = useState<{ slug: string; intro: Intro; cover: MediaItem | null; picking: boolean } | null>(null);
  const ro = !props.canEdit;
  const dirty = !deepEqual(list, saved) || Object.keys(intros).length > 0;

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

  const handle = (r: CmsResult) => {
    setMsg(r.ok ? { ok: true, text: r.message ?? "Saved." } : { ok: false, text: r.error });
    if (r.ok && r.hasDraft !== undefined) setHasDraft(r.hasDraft);
    return r.ok;
  };
  const save = async (publish: boolean) => {
    setBusy(true);
    const r = await saveCasesDraft(JSON.stringify(list), JSON.stringify(intros), publish);
    setBusy(false);
    if (handle(r)) {
      setSaved(list);
      setIntros({});
      router.refresh();
    }
  };
  const addMedia = (m: MediaItem) => setMedia((cur) => [m, ...cur]);
  const move = (i: number, d: number) =>
    setList((l) => {
      const c = l.slice();
      const [x] = c.splice(i, 1);
      c.splice(i + d, 0, x);
      return c;
    });
  const nameOf = (slug: string) => intros[slug]?.name || props.names[slug] || slug;

  return (
    <>
      <div className="a-card a-card--flush">
        {list.map((c, i) => (
          <details key={c.slug} className="a-cms-item" open={open === c.slug} onToggle={(e) => (e.currentTarget.open ? setOpen(c.slug) : open === c.slug && setOpen(null))} style={{ margin: 8 }}>
            <summary>
              <span className="a-cms-item__n">{String(i + 1).padStart(2, "0")}</span>
              <img src={c.cover.src} alt="" style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 6 }} />
              <span className="a-cms-item__title">
                {nameOf(c.slug)} {c.hidden ? <span className="a-chip">hidden</span> : null} {c.status === "preview" ? <span className="a-chip">preview</span> : null}
              </span>
              <a className="a-link a-small" href={`/portfolio/${c.slug}`} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
                /portfolio/{c.slug}
              </a>
              {!ro ? (
                <span className="a-cms-itemtools" onClick={(e) => e.preventDefault()}>
                  <label className="a-cms-check a-small" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={!c.hidden} onChange={(e) => setList((l) => l.map((x, j) => (j === i ? { ...x, hidden: e.target.checked ? undefined : true } : x)))} /> visible
                  </label>
                  <button type="button" className="a-iconbtn a-iconbtn--s" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    ↑
                  </button>
                  <button type="button" className="a-iconbtn a-iconbtn--s" aria-label="Move down" disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                    ↓
                  </button>
                  {!props.codeSlugs.includes(c.slug) ? (
                    <button type="button" className="a-iconbtn a-iconbtn--s a-iconbtn--danger" aria-label="Delete project" onClick={() => setList((l) => l.filter((x) => x.slug !== c.slug))}>
                      ✕
                    </button>
                  ) : null}
                </span>
              ) : null}
            </summary>
            {open === c.slug ? (
              <CaseCardEditor
                c={c}
                isNew={!saved.some((s) => s.slug === c.slug)}
                media={media}
                services={props.services}
                readOnly={ro}
                addMedia={addMedia}
                onChange={(next) => setList((l) => l.map((x, j) => (j === i ? next : x)))}
              />
            ) : null}
          </details>
        ))}
      </div>

      {!ro ? (
        adding ? (
          <div className="a-card">
            <h2 className="a-card__title">New project</h2>
            <div className="a-form">
              <div className="a-form__row">
                <label className="a-field">
                  <span>Address on the site: /portfolio/…</span>
                  <input value={adding.slug} maxLength={48} placeholder="e.g. cafe-aragats" onChange={(e) => setAdding({ ...adding, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
                </label>
                <label className="a-field">
                  <span>Name (English)</span>
                  <input value={adding.intro.name} maxLength={120} onChange={(e) => setAdding({ ...adding, intro: { ...adding.intro, name: e.target.value } })} />
                </label>
              </div>
              <div className="a-form__row">
                <label className="a-field">
                  <span>Industry (English)</span>
                  <input value={adding.intro.industry} maxLength={160} onChange={(e) => setAdding({ ...adding, intro: { ...adding.intro, industry: e.target.value } })} />
                </label>
                <label className="a-field a-field--wide">
                  <span>One-line teaser (English)</span>
                  <input value={adding.intro.teaser} maxLength={200} onChange={(e) => setAdding({ ...adding, intro: { ...adding.intro, teaser: e.target.value } })} />
                </label>
              </div>
              <div className="a-form__row">
                <button type="button" className="a-btn" onClick={() => setAdding({ ...adding, picking: true })}>
                  {adding.cover ? "Change cover image" : "Choose a cover image"}
                </button>
                {adding.cover ? <img src={adding.cover.url} alt="" style={{ width: 120, borderRadius: 8 }} /> : null}
              </div>
              <div className="a-form__row">
                <button
                  type="button"
                  className="a-btn a-btn--primary"
                  onClick={() => {
                    const slug = adding.slug.replace(/^-+|-+$/g, "");
                    if (!/^[a-z0-9][a-z0-9-]{1,48}$/.test(slug)) return setMsg({ ok: false, text: "Choose an address of at least 2 characters: lowercase letters, digits and dashes." });
                    if (list.some((c) => c.slug === slug)) return setMsg({ ok: false, text: "That address is already used." });
                    if (adding.intro.name.trim().length < 2) return setMsg({ ok: false, text: "Give the project an English name." });
                    if (!adding.cover) return setMsg({ ok: false, text: "Choose a cover image." });
                    const cover = { src: adding.cover.url, width: adding.cover.width ?? 2000, height: adding.cover.height ?? 1250, alt: "cover" };
                    setList((l) => [
                      ...l,
                      { slug, year: new Date().getFullYear(), client: adding.intro.name.trim(), showLogo: false, url: null, services: [], directions: [], accent: "#D4FF3A", accentInk: "#15130C", status: "preview", cover, gallery: [] },
                    ]);
                    setIntros((x) => ({ ...x, [slug]: { name: adding.intro.name.trim(), industry: adding.intro.industry.trim(), teaser: adding.intro.teaser.trim() } }));
                    setOpen(slug);
                    setAdding(null);
                    setMsg({ ok: true, text: "Added at the end — add gallery images, then save." });
                  }}
                >
                  Add the project
                </button>
                <button type="button" className="a-btn" onClick={() => setAdding(null)}>
                  Cancel
                </button>
              </div>
            </div>
            {adding.picking ? (
              <MediaPicker
                items={media}
                kind="image"
                onUploaded={addMedia}
                onClose={() => setAdding({ ...adding, picking: false })}
                onPick={(m) => setAdding({ ...adding, cover: m, picking: false })}
              />
            ) : null}
          </div>
        ) : (
          <button type="button" className="a-btn" style={{ justifySelf: "start" }} onClick={() => setAdding({ slug: "", intro: { name: "", industry: "", teaser: "" }, cover: null, picking: false })}>
            + Add a project
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
          <a className="a-btn" href="/admin/preview?mode=on&next=/portfolio" target="_blank" rel="noopener">
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
                    const r = await discardContent("cases", "*");
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
                    const r = await publishContent("cases", "*");
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
