import "server-only";
import { parse as parseIcu } from "@formatjs/icu-messageformat-parser";
import { all, get, run, tx } from "./db.ts";
import { audit } from "./audit.ts";
import { getContent as getCodeContent, getCatalogueCopy as getCodeCatalogue } from "@/content/index.ts";
import { services as codeServices, categories as codeCategories, type ServicePrice } from "@/data/services.ts";
import { caseStudies as codeCases, type CaseStudy } from "@/data/cases.ts";
import enMessages from "@/messages/en.json";
import ruMessages from "@/messages/ru.json";
import hyMessages from "@/messages/hy.json";
import {
  deepEqual,
  diffOverride,
  getAt,
  hashText,
  isPlainObject,
  mergeOverride,
  pathKey,
  placeholders,
  stringLeaves,
  type Json,
  type Path,
} from "@/lib/cms/merge.ts";
import { CMS_LOCALES, FIXED_LENGTH_KEYS, GLOBAL, LINK_KEYS, MESSAGE_NAMESPACES, READ_ONLY_KEYS, TOPIC_SLUGS, type CmsLocale } from "@/lib/cms/registry.ts";

/**
 * Content store for the admin CMS.
 *
 * Table content_docs keeps, per document and language, the *published* override (what the
 * site shows) and an optional *draft* override (what editors are working on). Publishing
 * copies the draft over the published value and records a version, so any earlier state
 * can be restored. Code defaults are never modified.
 */

const MESSAGES: Record<CmsLocale, Record<string, unknown>> = { en: enMessages, ru: ruMessages, hy: hyMessages };

export type Mode = "published" | "draft";

export interface ServiceEntry extends ServicePrice {
  /** Hidden services stay in the data (old briefs still resolve) but are not shown. */
  hidden?: boolean;
}

export interface CaseEntry extends CaseStudy {
  hidden?: boolean;
}

const EMPTY_CASE_COPY = {
  name: "",
  industry: "",
  teaser: "",
  summary: "",
  challenge: "",
  approach: "",
  scope: [] as string[],
  result: "",
  metricLabel: "",
  tags: [] as string[],
  alts: {} as Record<string, string>,
};

/* ───────── Code defaults ───────── */

export function isLocale(v: string): v is CmsLocale {
  return (CMS_LOCALES as readonly string[]).includes(v);
}

/** The value a document has in code, before any CMS change. */
export function codeDefault(key: string, locale: string): Json | undefined {
  if (key === "services") return codeServices as unknown as Json;
  if (key === "cases") return codeCases as unknown as Json;
  if (!isLocale(locale)) return undefined;
  const c = getCodeContent(locale);
  if (key === "home") return c.home as unknown as Json;
  if (key === "pricing") return c.pricingPage as unknown as Json;
  if (key === "faq") return c.faqPage as unknown as Json;
  if (key === "contacts") return c.contactsPage as unknown as Json;
  if (key === "portfolio") return c.portfolioPage as unknown as Json;
  if (key === "catalogue") {
    const cat = getCodeCatalogue(locale);
    return { serviceCopy: cat.serviceCopy, categoryCopy: cat.categoryCopy } as unknown as Json;
  }
  const [kind, id] = key.split(/:(.*)/s);
  if (kind === "service") return (c.servicePages.find((p) => p.slug === id) as unknown as Json) ?? undefined;
  if (kind === "topic") return (TOPIC_SLUGS as readonly string[]).includes(id) ? (c.topics[id as keyof typeof c.topics] as unknown as Json) : undefined;
  if (kind === "case") {
    if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(id ?? "")) return undefined;
    return ((c.cases as Record<string, unknown>)[id] as Json) ?? (EMPTY_CASE_COPY as unknown as Json);
  }
  if (kind === "messages") return (MESSAGE_NAMESPACES as readonly string[]).includes(id) ? (MESSAGES[locale][id] as Json) : undefined;
  return undefined;
}

export function isGlobalDoc(key: string) {
  return key === "services" || key === "cases";
}

/* ───────── Storage ───────── */

interface DocRow {
  key: string;
  locale: string;
  published: string | null;
  draft: string | null;
  basis: string | null;
  published_basis: string | null;
  draft_updated_at: number | null;
  draft_by: number | null;
  published_at: number | null;
  published_by: number | null;
}

const publishedCache = new Map<string, Json | undefined>();
let cacheGeneration = 0;

function rowOf(key: string, locale: string): DocRow | undefined {
  return get<DocRow>("SELECT * FROM content_docs WHERE key = ? AND locale = ?", key, locale);
}

function parse(json: string | null): Json | undefined {
  if (json === null) return undefined;
  try {
    return JSON.parse(json) as Json;
  } catch {
    return undefined;
  }
}

/** The override in effect for a mode (draft falls back to published when there is no draft). */
export function overrideOf(key: string, locale: string, mode: Mode): Json | undefined {
  const cacheKey = `${key}|${locale}`;
  if (mode === "published" && publishedCache.has(cacheKey)) return publishedCache.get(cacheKey);
  let row: DocRow | undefined;
  try {
    row = rowOf(key, locale);
  } catch {
    // No database (e.g. during `next build`) → code defaults.
    return undefined;
  }
  const published = parse(row?.published ?? null);
  if (mode === "published") {
    publishedCache.set(cacheKey, published);
    return published;
  }
  return row?.draft != null ? parse(row.draft) : published;
}

export function effective<T = Json>(key: string, locale: string, mode: Mode): T {
  const d = codeDefault(key, locale);
  return mergeOverride(d, overrideOf(key, locale, mode)) as T;
}

export function invalidateContentCache() {
  publishedCache.clear();
  cacheGeneration++;
}

export function contentGeneration() {
  return cacheGeneration;
}

/* ───────── Validation ───────── */

export class ContentError extends Error {
  constructor(
    message: string,
    public path: Path = [],
  ) {
    super(message);
  }
}

const LINK_RE = /^(\/(?![/\\])[^\s<>"]*|https:\/\/[^\s<>"]+|mailto:[^\s<>"]+|tel:\+?[\d\s()-]+|#[\w-]*)?$/;
// Control characters other than newline and tab never belong in copy.
const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f‪-‮⁦-⁩]/g;

function clean(s: string) {
  return s.replace(CONTROL_RE, "").replace(/\r\n?/g, "\n");
}

/**
 * Checks an edited tree against its code default and returns a cleaned copy.
 * - types must match the default;
 * - technical keys (slug, id, …) keep their code value;
 * - links must be site paths or https/mailto/tel;
 * - interface strings keep their placeholders and stay valid ICU messages.
 */
export function validateTree(def: unknown, value: unknown, opts: { messages: boolean }, path: Path = []): Json {
  const key = path[path.length - 1];
  if (typeof key === "string" && READ_ONLY_KEYS.has(key) && def !== undefined) return def as Json;

  if (typeof def === "string" || (def === undefined && typeof value === "string")) {
    if (typeof value !== "string") throw new ContentError("Expected text", path);
    const s = clean(value);
    if (s.length > 10_000) throw new ContentError("Text is too long (max 10,000 characters)", path);
    if (typeof key === "string" && LINK_KEYS.has(key) && !LINK_RE.test(s.trim())) {
      throw new ContentError("A link must start with / (a page on this site), https://, mailto: or tel:", path);
    }
    if (opts.messages && typeof def === "string" && s !== def) {
      const want = placeholders(def);
      const got = placeholders(s);
      if (want.join("|") !== got.join("|")) {
        throw new ContentError(`Keep these placeholders exactly: ${want.join(" ") || "(none)"} — found: ${got.join(" ") || "(none)"}`, path);
      }
      try {
        parseIcu(s);
      } catch {
        throw new ContentError("The text has unbalanced { } or < > — check the placeholders", path);
      }
    }
    return s;
  }
  if (typeof def === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new ContentError("Expected a number", path);
    return value;
  }
  if (typeof def === "boolean") {
    if (typeof value !== "boolean") throw new ContentError("Expected yes/no", path);
    return value;
  }
  if (Array.isArray(def)) {
    if (!Array.isArray(value)) throw new ContentError("Expected a list", path);
    if (typeof key === "string" && FIXED_LENGTH_KEYS.has(key) && value.length !== def.length) {
      throw new ContentError(`This list must keep ${def.length} items`, path);
    }
    if (value.length > 200) throw new ContentError("Too many items", path);
    const template = def[0];
    return value.map((v, i) => validateTree(def[i] ?? template, v, opts, [...path, i]));
  }
  if (isPlainObject(def)) {
    if (!isPlainObject(value)) throw new ContentError("Expected a group of fields", path);
    const out: Record<string, Json> = {};
    for (const [k, dv] of Object.entries(def)) {
      if (value[k] === undefined) {
        out[k] = dv as Json;
        continue;
      }
      out[k] = validateTree(dv, value[k], opts, [...path, k]);
    }
    // Extra keys are allowed only in maps whose keys are data (service copy, alt texts).
    for (const [k, v] of Object.entries(value)) {
      if (k in def) continue;
      if (!/^[a-z0-9][a-zA-Z0-9-]{0,60}$/.test(k)) throw new ContentError(`Unexpected field “${k}”`, path);
      const sample = Object.values(def)[0];
      if (sample === undefined) {
        if (typeof v !== "string") throw new ContentError(`Unexpected field “${k}”`, [...path, k]);
        out[k] = clean(v);
      } else {
        out[k] = validateTree(sample, v, opts, [...path, k]);
      }
    }
    return out;
  }
  if (def === null || def === undefined) {
    // Optional fields absent from the code default (e.g. a case without a metric).
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value as Json;
    throw new ContentError("Unexpected value", path);
  }
  throw new ContentError("Unsupported value", path);
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const ASSET_RE = /^\/(work|media)\/[A-Za-z0-9/_.-]+\.(webp|png|jpe?g|avif)$/;
const VIDEO_RE = /^\/(work|media)\/[A-Za-z0-9/_.-]+\.(mp4|webm)$/;

function num(v: unknown, path: Path, min: number, max: number, int = true): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max || (int && !Number.isInteger(v))) {
    throw new ContentError(`Expected a number from ${min} to ${max}`, path);
  }
  return v;
}

function text(v: unknown, path: Path, max = 200): string {
  if (typeof v !== "string") throw new ContentError("Expected text", path);
  const s = clean(v).trim();
  if (s.length > max) throw new ContentError(`Too long (max ${max})`, path);
  return s;
}

export function validateServices(value: unknown): ServiceEntry[] {
  if (!Array.isArray(value) || !value.length || value.length > 80) throw new ContentError("Expected a list of services");
  const ids = new Set<string>();
  const cats = new Set(codeCategories.map((c) => c.id));
  return value.map((raw, i) => {
    const p: Path = [i];
    if (!isPlainObject(raw)) throw new ContentError("Expected a service", p);
    const id = text(raw.id, [...p, "id"], 50);
    if (!SLUG_RE.test(id)) throw new ContentError("ID: lowercase letters, digits and dashes", [...p, "id"]);
    if (ids.has(id)) throw new ContentError(`Duplicate ID ${id}`, [...p, "id"]);
    ids.add(id);
    const category = text(raw.category, [...p, "category"], 30);
    if (!cats.has(category as never)) throw new ContentError("Unknown category", [...p, "category"]);
    const billingType = raw.billingType === "monthly" ? "monthly" : raw.billingType === "one_time" ? "one_time" : null;
    if (!billingType) throw new ContentError("Billing: one-time or monthly", [...p, "billingType"]);
    const tl = raw.timeline;
    if (!isPlainObject(tl) || !["days", "weeks", "months", "monthly"].includes(String(tl.kind))) throw new ContentError("Timeline", [...p, "timeline"]);
    const timeline =
      tl.kind === "monthly" ? { kind: "monthly" as const } : { kind: tl.kind as "days" | "weeks" | "months", from: num(tl.from, [...p, "timeline", "from"], 1, 120) };
    const detailPage = text(raw.detailPage ?? "/price", [...p, "detailPage"], 200);
    if (!LINK_RE.test(detailPage) || !detailPage.startsWith("/")) throw new ContentError("Detail page must be a path on this site", [...p, "detailPage"]);
    return {
      id: id as ServicePrice["id"],
      category: category as ServicePrice["category"],
      regularPriceUsd: num(raw.regularPriceUsd, [...p, "regularPriceUsd"], 0, 1_000_000, false),
      billingType,
      timeline,
      detailPage,
      promoEligible: raw.promoEligible !== false,
      ...(raw.thirdPartySpendSeparate ? { thirdPartySpendSeparate: true } : {}),
      ...(raw.featured ? { featured: true } : {}),
      ...(raw.hidden ? { hidden: true } : {}),
    };
  });
}

function validateImage(v: unknown, path: Path): CaseStudy["cover"] {
  if (!isPlainObject(v)) throw new ContentError("Expected an image", path);
  const src = text(v.src, [...path, "src"], 300);
  if (!ASSET_RE.test(src) || src.includes("..")) throw new ContentError("Choose an image from the media library", [...path, "src"]);
  const img: CaseStudy["cover"] = {
    src,
    width: num(v.width, [...path, "width"], 16, 8000),
    height: num(v.height, [...path, "height"], 16, 8000),
    alt: text(v.alt ?? "", [...path, "alt"], 60) || "image",
  };
  if (v.span !== undefined && v.span !== null) {
    if (!["full", "half", "tall", "reel"].includes(String(v.span))) throw new ContentError("Layout", [...path, "span"]);
    img.span = v.span as CaseStudy["cover"]["span"];
  }
  if (v.tone === "light" || v.tone === "dark") img.tone = v.tone;
  if (v.cutout) img.cutout = true;
  if (v.video) {
    const video = text(v.video, [...path, "video"], 300);
    if (!VIDEO_RE.test(video) || video.includes("..")) throw new ContentError("Choose a video from the media library", [...path, "video"]);
    img.video = video;
  }
  return img;
}

const DIRECTIONS = ["design", "development", "mobile-apps", "marketing", "ai", "content"];

export function validateCases(value: unknown, serviceIds: Set<string>): CaseEntry[] {
  if (!Array.isArray(value) || value.length > 100) throw new ContentError("Expected a list of projects");
  const slugs = new Set<string>();
  return value.map((raw, i) => {
    const p: Path = [i];
    if (!isPlainObject(raw)) throw new ContentError("Expected a project", p);
    const slug = text(raw.slug, [...p, "slug"], 60);
    if (!SLUG_RE.test(slug)) throw new ContentError("Address: lowercase letters, digits and dashes", [...p, "slug"]);
    if (slugs.has(slug)) throw new ContentError(`Duplicate address ${slug}`, [...p, "slug"]);
    slugs.add(slug);
    const url = raw.url ? text(raw.url, [...p, "url"], 300) : null;
    if (url && !/^https:\/\/[^\s<>"]+$/.test(url)) throw new ContentError("Website must start with https://", [...p, "url"]);
    const accent = text(raw.accent ?? "#D4FF3A", [...p, "accent"], 7);
    const accentInk = text(raw.accentInk ?? "#15130C", [...p, "accentInk"], 7);
    if (!HEX_RE.test(accent) || !HEX_RE.test(accentInk)) throw new ContentError("Colours are #RRGGBB", [...p, "accent"]);
    const services = Array.isArray(raw.services) ? raw.services.filter((s): s is string => typeof s === "string" && serviceIds.has(s)) : [];
    const directions = Array.isArray(raw.directions) ? raw.directions.filter((d): d is string => typeof d === "string" && DIRECTIONS.includes(d)) : [];
    const entry: CaseEntry = {
      slug,
      year: num(raw.year, [...p, "year"], 2000, 2100),
      client: raw.client ? text(raw.client, [...p, "client"], 120) : null,
      showLogo: Boolean(raw.showLogo),
      url,
      services: services as CaseStudy["services"],
      directions: directions as CaseStudy["directions"],
      accent,
      accentInk,
      cover: validateImage(raw.cover, [...p, "cover"]),
      gallery: Array.isArray(raw.gallery) ? raw.gallery.slice(0, 60).map((g, j) => validateImage(g, [...p, "gallery", j])) : [],
    };
    if (Array.isArray(raw.palette)) {
      entry.palette = raw.palette
        .filter((c): c is { hex: string; key: string } => isPlainObject(c) && typeof c.hex === "string" && HEX_RE.test(c.hex))
        .slice(0, 6)
        .map((c) => ({ hex: c.hex, key: (["primary", "accent", "secondary"].includes(c.key) ? c.key : "accent") as "primary" }));
    }
    if (isPlainObject(raw.metric) && typeof raw.metric.value === "number") {
      entry.metric = {
        value: num(raw.metric.value, [...p, "metric", "value"], 0, 1e12, false),
        ...(raw.metric.prefix ? { prefix: text(raw.metric.prefix, [...p, "metric", "prefix"], 6) } : {}),
        ...(raw.metric.suffix ? { suffix: text(raw.metric.suffix, [...p, "metric", "suffix"], 10) } : {}),
      };
    }
    if (raw.status === "preview" || raw.status === "live") entry.status = raw.status;
    if (raw.feature) entry.feature = validateImage(raw.feature, [...p, "feature"]);
    if (raw.hidden) entry.hidden = true;
    return entry;
  });
}

/* ───────── Edits ───────── */

/**
 * For translations: the hash of the English text each translated field was written against,
 * so the editor can flag fields whose English has changed since. A field keeps its old entry
 * while its text stays the same; editing it, or ticking "still correct", records the current
 * English.
 */
function basisFor(key: string, locale: string, value: Json, ack: string[]): Record<string, string> {
  if (locale === "en" || isGlobalDoc(key)) return {};
  const localeDefault = codeDefault(key, locale);
  const prev = docState(key, locale);
  const en = effective(key, "en", "draft");
  const acked = new Set(ack);
  const out: Record<string, string> = {};
  for (const leaf of stringLeaves(value)) {
    const k = pathKey(leaf.path);
    const src = getAt(en, leaf.path);
    if (typeof src !== "string") continue;
    if (acked.has(k)) {
      out[k] = hashText(src);
      continue;
    }
    if (getAt(localeDefault, leaf.path) === leaf.value && !(k in prev.basis)) continue;
    out[k] = getAt(prev.draft, leaf.path) === leaf.value && k in prev.basis ? prev.basis[k] : hashText(src);
  }
  return out;
}

export interface DocState {
  key: string;
  locale: string;
  defaults: Json | undefined;
  draft: Json;
  published: Json;
  hasDraft: boolean;
  hasOverride: boolean;
  basis: Record<string, string>;
  draftUpdatedAt: number | null;
  draftBy: string | null;
  publishedAt: number | null;
  publishedBy: string | null;
}

export function docState(key: string, locale: string): DocState {
  const row = get<DocRow & { draft_name: string | null; pub_name: string | null }>(
    `SELECT d.*, du.name AS draft_name, pu.name AS pub_name FROM content_docs d
     LEFT JOIN users du ON du.id = d.draft_by LEFT JOIN users pu ON pu.id = d.published_by
     WHERE d.key = ? AND d.locale = ?`,
    key,
    locale,
  );
  const defaults = codeDefault(key, locale);
  const published = parse(row?.published ?? null);
  const draft = row?.draft != null ? parse(row.draft) : published;
  let basis: Record<string, string> = {};
  try {
    basis = JSON.parse((row?.draft != null ? row?.basis : row?.published_basis) || "{}");
  } catch {
    basis = {};
  }
  return {
    key,
    locale,
    defaults,
    draft: mergeOverride(defaults, draft) as Json,
    published: mergeOverride(defaults, published) as Json,
    hasDraft: row?.draft != null,
    hasOverride: published !== undefined,
    basis,
    draftUpdatedAt: row?.draft_updated_at ?? null,
    draftBy: row?.draft_name ?? null,
    publishedAt: row?.published_at ?? null,
    publishedBy: row?.pub_name ?? null,
  };
}

function liveServiceIds(mode: Mode): Set<string> {
  const list = effective<ServiceEntry[]>("services", GLOBAL, mode);
  return new Set(list.map((s) => s.id));
}

/** Validates and stores a draft. Returns the stored override (null = same as code). */
export function saveDraft(key: string, locale: string, value: unknown, userId: number, ack: string[] = []) {
  const defaults = codeDefault(key, locale);
  if (defaults === undefined) throw new ContentError("Unknown document");
  let cleanValue: Json;
  if (key === "services") cleanValue = validateServices(value) as unknown as Json;
  else if (key === "cases") cleanValue = validateCases(value, liveServiceIds("draft")) as unknown as Json;
  else cleanValue = validateTree(defaults, value, { messages: key.startsWith("messages:") });

  const override = diffOverride(defaults, cleanValue) ?? null;
  const json = override === null ? null : JSON.stringify(override);
  if (json && json.length > 400_000) throw new ContentError("This document is too large");
  const basis = JSON.stringify(basisFor(key, locale, cleanValue, ack));
  const now = Date.now();
  const row = rowOf(key, locale);
  const publishedJson = row?.published ?? null;
  const same = (json ?? "null") === (publishedJson ?? "null") || deepEqual(parse(json), parse(publishedJson));
  if (same) {
    // Same text as the live version: no draft. Translation checks ("still correct") apply
    // straight away, because they don't change what visitors see.
    run(
      `INSERT INTO content_docs (key, locale, published_basis) VALUES (?, ?, ?)
       ON CONFLICT(key, locale) DO UPDATE SET draft = NULL, basis = NULL, published_basis = excluded.published_basis`,
      key,
      locale,
      basis,
    );
  } else {
    run(
      `INSERT INTO content_docs (key, locale, draft, basis, draft_updated_at, draft_by) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(key, locale) DO UPDATE SET draft = excluded.draft, basis = excluded.basis, draft_updated_at = excluded.draft_updated_at, draft_by = excluded.draft_by`,
      key,
      locale,
      // "{}" marks a draft that resets everything to the code default.
      json ?? "{}",
      basis,
      now,
      userId,
    );
  }
  audit("content.draft", { userId, entity: "content", entityId: `${key}/${locale}` });
  return override;
}

export function discardDraft(key: string, locale: string, userId: number) {
  run("UPDATE content_docs SET draft = NULL, basis = NULL WHERE key = ? AND locale = ?", key, locale);
  audit("content.discard", { userId, entity: "content", entityId: `${key}/${locale}` });
}

const KEEP_VERSIONS = 40;

export function publishDoc(key: string, locale: string, userId: number, note = ""): boolean {
  const row = rowOf(key, locale);
  if (!row || row.draft === null) return false;
  const value = row.draft === "{}" ? null : row.draft;
  const now = Date.now();
  tx(() => {
    run(
      "UPDATE content_docs SET published = ?, published_basis = basis, draft = NULL, published_at = ?, published_by = ? WHERE key = ? AND locale = ?",
      value,
      now,
      userId,
      key,
      locale,
    );
    run(
      "INSERT INTO content_versions (key, locale, data, basis, created_at, user_id, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
      key,
      locale,
      value,
      row.basis,
      now,
      userId,
      note.slice(0, 200) || null,
    );
    run(
      `DELETE FROM content_versions WHERE key = ? AND locale = ? AND id NOT IN
        (SELECT id FROM content_versions WHERE key = ? AND locale = ? ORDER BY created_at DESC, id DESC LIMIT ?)`,
      key,
      locale,
      key,
      locale,
      KEEP_VERSIONS,
    );
  });
  invalidateContentCache();
  audit("content.publish", { userId, entity: "content", entityId: `${key}/${locale}` });
  return true;
}

export function pendingDrafts(): { key: string; locale: string; draft_updated_at: number; name: string | null }[] {
  return all(
    `SELECT d.key, d.locale, d.draft_updated_at, u.name FROM content_docs d LEFT JOIN users u ON u.id = d.draft_by
     WHERE d.draft IS NOT NULL ORDER BY d.draft_updated_at DESC`,
  );
}

export function publishAll(userId: number): number {
  let n = 0;
  for (const d of pendingDrafts()) if (publishDoc(d.key, d.locale, userId)) n++;
  return n;
}

export function versions(key: string, locale: string) {
  return all<{ id: number; created_at: number; name: string | null; note: string | null; size: number }>(
    `SELECT v.id, v.created_at, u.name, v.note, LENGTH(COALESCE(v.data, '')) AS size FROM content_versions v
     LEFT JOIN users u ON u.id = v.user_id WHERE v.key = ? AND v.locale = ? ORDER BY v.created_at DESC, v.id DESC`,
    key,
    locale,
  );
}

/** Puts an earlier published version back as the draft (publish it to make it live). */
export function restoreVersion(id: number, userId: number) {
  const v = get<{ key: string; locale: string; data: string | null; basis: string | null }>("SELECT key, locale, data, basis FROM content_versions WHERE id = ?", id);
  if (!v) return null;
  run(
    `INSERT INTO content_docs (key, locale, draft, basis, draft_updated_at, draft_by) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(key, locale) DO UPDATE SET draft = excluded.draft, basis = excluded.basis, draft_updated_at = excluded.draft_updated_at, draft_by = excluded.draft_by`,
    v.key,
    v.locale,
    v.data ?? "{}",
    v.basis,
    Date.now(),
    userId,
  );
  audit("content.restore", { userId, entity: "content", entityId: `${v.key}/${v.locale}`, meta: { version: id } });
  return { key: v.key, locale: v.locale };
}

/** Status of every document for the overview page. */
export function docStatuses(): Map<string, { draft: boolean; published: boolean; publishedAt: number | null }> {
  const map = new Map<string, { draft: boolean; published: boolean; publishedAt: number | null }>();
  for (const r of all<{ key: string; locale: string; draft: string | null; published: string | null; published_at: number | null }>(
    "SELECT key, locale, draft, published, published_at FROM content_docs",
  )) {
    map.set(`${r.key}|${r.locale}`, { draft: r.draft !== null, published: r.published !== null, publishedAt: r.published_at });
  }
  return map;
}
