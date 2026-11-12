import "server-only";
import { getContent as getCodeContent } from "@/content/index.ts";
import { docList as registryDocList, GLOBAL, TOPIC_SLUGS, type DocInfo } from "@/lib/cms/registry.ts";
import { effective, type CaseEntry, type ServiceEntry } from "./cms.ts";
import { all } from "./db.ts";

export { docStatuses, effective, pendingDrafts, docState, versions, codeDefault } from "./cms.ts";
export type { CaseEntry, ServiceEntry } from "./cms.ts";

/** Every editable document with a readable English label (for the admin panel). */
export function docList(): DocInfo[] {
  const en = getCodeContent("en");
  const caseList = effective<CaseEntry[]>("cases", GLOBAL, "draft");
  return registryDocList({
    servicePageSlugs: en.servicePages.map((p) => ({ slug: p.slug, label: p.label })),
    topics: TOPIC_SLUGS.map((slug) => ({ slug, label: en.topics[slug].label })),
    cases: caseList.map((c) => ({
      slug: c.slug,
      label: (en.cases as Record<string, { name: string }>)[c.slug]?.name || effective<{ name: string }>(`case:${c.slug}`, "en", "draft").name || c.slug,
    })),
  });
}

/** Options for the ID pickers in the editor (services, topic pages). */
export function referenceOptions() {
  const services = effective<ServiceEntry[]>("services", GLOBAL, "draft");
  const names = effective<{ serviceCopy: Record<string, { name: string }> }>("catalogue", "en", "draft").serviceCopy;
  const en = getCodeContent("en");
  return {
    service: services.map((s) => ({ value: s.id, label: `${names[s.id]?.name ?? s.id}${s.hidden ? " (hidden)" : ""}` })),
    topic: TOPIC_SLUGS.map((slug) => ({ value: slug, label: en.topics[slug].label })),
  };
}

export interface MediaItem {
  id: number;
  file: string;
  kind: "image" | "video";
  mime: string;
  width: number | null;
  height: number | null;
  bytes: number;
  name: string | null;
  created_at: number;
}

export function mediaList(): MediaItem[] {
  return all<MediaItem>("SELECT id, file, kind, mime, width, height, bytes, name, created_at FROM media ORDER BY created_at DESC LIMIT 1000");
}

import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

type BuiltIn = { url: string; kind: "image" | "video"; width: number | null; height: number | null; name: string; bytes: number; builtIn: true };
let builtInCache: BuiltIn[] | null = null;

/** Images and videos that ship with the site (public/work), so editors can reuse them. */
export async function builtInMedia(): Promise<BuiltIn[]> {
  if (builtInCache) return builtInCache;
  const root = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "work");
  const out: BuiltIn[] = [];
  let dirs: string[] = [];
  try {
    dirs = readdirSync(root);
  } catch {
    dirs = [];
  }
  for (const d of dirs) {
    let files: string[] = [];
    try {
      files = readdirSync(path.join(root, d));
    } catch {
      continue;
    }
    for (const f of files) {
      const full = path.join(root, d, f);
      const url = `/work/${d}/${f}`;
      if (/\.(webp|png|jpe?g|avif)$/i.test(f)) {
        let width: number | null = null;
        let height: number | null = null;
        try {
          const m = await sharp(full).metadata();
          width = m.width ?? null;
          height = m.height ?? null;
        } catch {
          /* unreadable file: listed without a size */
        }
        out.push({ url, kind: "image", width, height, name: `${d}/${f}`, bytes: statSync(full).size, builtIn: true });
      } else if (/\.(mp4|webm)$/i.test(f)) {
        out.push({ url, kind: "video", width: null, height: null, name: `${d}/${f}`, bytes: statSync(full).size, builtIn: true });
      }
    }
  }
  builtInCache = out;
  return out;
}

/** Uploaded and built-in media in the shape the admin pickers use. */
export async function allMedia() {
  const uploads = mediaList().map((m) => ({ id: m.id, url: `/media/${m.file}`, kind: m.kind, width: m.width, height: m.height, name: m.name, bytes: m.bytes }));
  return [...uploads, ...(await builtInMedia())];
}
