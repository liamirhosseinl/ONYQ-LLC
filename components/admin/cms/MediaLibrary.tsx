"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMedia, renameMedia } from "@/app/admin/cms-actions.ts";

export interface MediaItem {
  id?: number;
  url: string;
  kind: "image" | "video";
  width: number | null;
  height: number | null;
  name: string | null;
  bytes?: number;
  /** Files that ship with the site (public/work) can be picked but not deleted. */
  builtIn?: boolean;
}

const size = (b?: number) => (b === undefined ? "" : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);

/** Uploads one file; images come back as WebP with their real size. */
export async function uploadFile(file: File): Promise<{ ok: true; item: MediaItem } | { ok: false; error: string }> {
  const body = new FormData();
  body.set("file", file);
  try {
    const res = await fetch("/admin/media-upload", { method: "POST", body });
    const data = (await res.json()) as { ok: boolean; error?: string; url?: string; kind?: "image" | "video"; width?: number; height?: number };
    if (!data.ok || !data.url) return { ok: false, error: data.error ?? "Upload failed." };
    return { ok: true, item: { url: data.url, kind: data.kind ?? "image", width: data.width ?? null, height: data.height ?? null, name: file.name, bytes: file.size } };
  } catch {
    return { ok: false, error: "Upload failed — check the connection." };
  }
}

export function UploadZone({ onUploaded, accept = "image/*,video/mp4,video/webm" }: { onUploaded: (item: MediaItem) => void; accept?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const send = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      setStatus(`Uploading ${f.name}…`);
      const r = await uploadFile(f);
      if (!r.ok) {
        setStatus(`${f.name}: ${r.error}`);
        return;
      }
      onUploaded(r.item);
    }
    setStatus("Uploaded.");
  };

  return (
    <div
      className="a-cms-drop"
      data-over={over || undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void send(e.dataTransfer.files);
      }}
    >
      <p>
        Drop images or videos here, or{" "}
        <button type="button" className="a-linkbtn" onClick={() => input.current?.click()}>
          choose files
        </button>
      </p>
      <p className="a-small">Images (JPG, PNG, WebP, AVIF) up to 25 MB are converted to WebP, max 2400 px wide. Videos: MP4 or WebM up to 80 MB.</p>
      {status ? (
        <p className="a-small" role="status">
          {status}
        </p>
      ) : null}
      <input ref={input} type="file" accept={accept} multiple hidden onChange={(e) => void send(e.target.files)} />
    </div>
  );
}

export function MediaGrid({ items, onPick, selected, kind }: { items: MediaItem[]; onPick?: (m: MediaItem) => void; selected?: string; kind?: "image" | "video" }) {
  const shown = kind ? items.filter((m) => m.kind === kind) : items;
  if (!shown.length) return <p className="a-muted a-small">Nothing here yet.</p>;
  return (
    <div className="a-cms-media">
      {shown.map((m) => {
        const inner = (
          <>
            <span className="a-cms-media__thumb">
              {m.kind === "image" ? <img src={m.url} alt="" loading="lazy" /> : <video src={m.url} muted preload="metadata" />}
            </span>
            <span className="a-cms-media__meta" title={m.name ?? m.url}>
              {m.name ?? m.url.split("/").pop()}
            </span>
            <span className="a-cms-media__meta">
              {m.kind === "image" && m.width ? `${m.width}×${m.height}` : m.kind} {size(m.bytes)}
              {m.builtIn ? " · site file" : ""}
            </span>
          </>
        );
        return onPick ? (
          <button key={m.url} type="button" className="a-cms-media__item" data-on={selected === m.url || undefined} onClick={() => onPick(m)}>
            {inner}
          </button>
        ) : (
          <MediaCard key={m.url} item={m}>
            {inner}
          </MediaCard>
        );
      })}
    </div>
  );
}

function MediaCard({ item, children }: { item: MediaItem; children: React.ReactNode }) {
  const router = useRouter();
  const [name, setName] = useState(item.name ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  return (
    <div className="a-cms-media__item">
      {children}
      {item.id ? (
        <>
          <input
            aria-label="Name"
            value={name}
            maxLength={160}
            onChange={(e) => setName(e.target.value)}
            onBlur={async () => {
              if (name !== (item.name ?? "")) await renameMedia(item.id!, name);
            }}
          />
          <span className="a-cms-inline">
            <button type="button" className="a-btn a-btn--small" onClick={() => navigator.clipboard?.writeText(item.url).then(() => setMsg("Link copied"))}>
              Copy link
            </button>
            <button
              type="button"
              className="a-btn a-btn--small a-btn--ghost-danger"
              onClick={async () => {
                if (!armed) {
                  setArmed(true);
                  setTimeout(() => setArmed(false), 4000);
                  return;
                }
                const r = await deleteMedia(item.id!);
                if (r.ok) router.refresh();
                else setMsg(r.error);
              }}
            >
              {armed ? "Click again" : "Delete"}
            </button>
          </span>
          {msg ? <span className="a-small a-muted">{msg}</span> : null}
        </>
      ) : null}
    </div>
  );
}

/** Modal used by the portfolio editor to choose an image or a video. */
export function MediaPicker({
  items,
  kind,
  selected,
  onPick,
  onClose,
  onUploaded,
}: {
  items: MediaItem[];
  kind: "image" | "video";
  selected?: string;
  onPick: (m: MediaItem) => void;
  onClose: () => void;
  onUploaded: (m: MediaItem) => void;
}) {
  return (
    <div className="a-cms-picker" role="dialog" aria-modal="true" aria-label={`Choose ${kind === "image" ? "an image" : "a video"}`} onClick={onClose}>
      <div className="a-cms-picker__box" onClick={(e) => e.stopPropagation()}>
        <div className="a-cms-inline" style={{ justifyContent: "space-between" }}>
          <b>Choose {kind === "image" ? "an image" : "a video"}</b>
          <button type="button" className="a-btn a-btn--small" onClick={onClose}>
            Close
          </button>
        </div>
        <UploadZone
          accept={kind === "image" ? "image/*" : "video/mp4,video/webm"}
          onUploaded={(m) => {
            onUploaded(m);
            if (m.kind === kind) onPick(m);
          }}
        />
        <MediaGrid items={items} kind={kind} selected={selected} onPick={onPick} />
      </div>
    </div>
  );
}

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  return (
    <>
      <UploadZone onUploaded={() => router.refresh()} />
      <MediaGrid items={items} />
    </>
  );
}
