"use server";

import { z } from "zod";
import { rmSync } from "node:fs";
import path from "node:path";
import { requireUser } from "@/lib/server/auth.ts";
import { all, get, run, dataDir } from "@/lib/server/db.ts";
import { audit } from "@/lib/server/audit.ts";
import {
  ContentError,
  codeDefault,
  discardDraft,
  docState,
  isGlobalDoc,
  isLocale,
  publishAll,
  publishDoc,
  restoreVersion,
  saveDraft,
} from "@/lib/server/cms.ts";
import { GLOBAL } from "@/lib/cms/registry.ts";
import type { Json } from "@/lib/cms/merge.ts";

/*
 * Content actions. Editing needs the manager role; publishing, restoring and deleting media
 * need admin. Every action validates its input and writes an audit entry (lib/server/cms.ts).
 */

export type CmsResult = { ok: true; message?: string; hasDraft?: boolean } | { ok: false; error: string; path?: (string | number)[] };

const docKey = z.string().min(2).max(120).regex(/^[a-z][a-z0-9:-]*$/i);
const localeOf = (key: string, locale: string) => (isGlobalDoc(key) ? GLOBAL : locale);

function checkDoc(key: string, locale: string) {
  const loc = localeOf(key, locale);
  if (!isGlobalDoc(key) && !isLocale(loc)) throw new ContentError("Unknown language");
  if (codeDefault(key, loc) === undefined) throw new ContentError("Unknown document");
  return loc;
}

function fail(e: unknown): CmsResult {
  if (e instanceof ContentError) return { ok: false, error: e.message, path: e.path };
  console.error("[cms]", e);
  return { ok: false, error: "Something went wrong. Nothing was changed." };
}

export async function saveContent(key: string, locale: string, json: string, publish = false, ack: string[] = []): Promise<CmsResult> {
  const user = await requireUser("manager");
  try {
    docKey.parse(key);
    const loc = checkDoc(key, locale);
    if (json.length > 600_000) throw new ContentError("This document is too large to save at once");
    let value: unknown;
    try {
      value = JSON.parse(json);
    } catch {
      throw new ContentError("The editor sent damaged data — reload the page");
    }
    saveDraft(key, loc, value, user.id, z.array(z.string().max(300)).max(5000).parse(ack));
    if (publish) {
      if (user.role !== "admin" && user.role !== "owner") return { ok: true, hasDraft: true, message: "Draft saved. Only an admin can publish." };
      publishDoc(key, loc, user.id);
      return { ok: true, hasDraft: false, message: "Published — the website shows it now." };
    }
    return { ok: true, hasDraft: docState(key, loc).hasDraft, message: "Draft saved. Publish when it’s ready." };
  } catch (e) {
    return fail(e);
  }
}

export async function publishContent(key: string, locale: string): Promise<CmsResult> {
  const user = await requireUser("admin");
  try {
    const loc = checkDoc(key, locale);
    const done = publishDoc(key, loc, user.id);
    // New services carry their names in the catalogue drafts — publish those together.
    if (key === "services") for (const l of ["en", "ru", "hy"]) publishDoc("catalogue", l, user.id);
    // A new project's English intro is a draft of its own document — publish it with the list.
    if (key === "cases") {
      const codeSlugs = new Set((codeDefault("cases", GLOBAL) as { slug: string }[]).map((c) => c.slug));
      for (const c of docState("cases", GLOBAL).published as unknown as { slug: string }[]) {
        if (!codeSlugs.has(c.slug)) publishDoc(`case:${c.slug}`, "en", user.id);
      }
    }
    return done ? { ok: true, hasDraft: false, message: "Published." } : { ok: false, error: "There is no draft to publish." };
  } catch (e) {
    return fail(e);
  }
}

export async function discardContent(key: string, locale: string): Promise<CmsResult> {
  const user = await requireUser("manager");
  try {
    const loc = checkDoc(key, locale);
    discardDraft(key, loc, user.id);
    return { ok: true, hasDraft: false, message: "Draft discarded — back to the published version." };
  } catch (e) {
    return fail(e);
  }
}

export async function publishEverything(): Promise<CmsResult> {
  const user = await requireUser("admin");
  const n = publishAll(user.id);
  return { ok: true, message: n ? `Published ${n} ${n === 1 ? "document" : "documents"}.` : "Nothing to publish." };
}

export async function restoreContentVersion(id: number): Promise<CmsResult> {
  const user = await requireUser("admin");
  const r = restoreVersion(z.number().int().positive().parse(id), user.id);
  return r ? { ok: true, hasDraft: true, message: "That version is now the draft. Check it and publish." } : { ok: false, error: "Version not found." };
}

/** Resets a whole document to the text that ships with the code (as a draft). */
export async function resetContent(key: string, locale: string): Promise<CmsResult> {
  const user = await requireUser("manager");
  try {
    const loc = checkDoc(key, locale);
    saveDraft(key, loc, codeDefault(key, loc) as Json, user.id);
    return { ok: true, hasDraft: docState(key, loc).hasDraft, message: "Draft reset to the original text. Publish to apply it." };
  } catch (e) {
    return fail(e);
  }
}

/* ───────── Services (adds copy for new services in every language) ───────── */

const copySchema = z.object({ name: z.string().trim().min(2).max(120), short: z.string().trim().max(300) });

export async function saveServicesDraft(json: string, newCopy: string, publish = false): Promise<CmsResult> {
  const user = await requireUser("manager");
  try {
    const list = JSON.parse(json) as unknown;
    const copies = z.record(z.string(), z.object({ en: copySchema, ru: copySchema, hy: copySchema })).parse(JSON.parse(newCopy || "{}"));
    saveDraft("services", GLOBAL, list, user.id);
    for (const [id, byLocale] of Object.entries(copies)) {
      for (const loc of ["en", "ru", "hy"] as const) {
        const st = docState("catalogue", loc);
        const draft = st.draft as { serviceCopy: Record<string, unknown>; categoryCopy: unknown };
        saveDraft("catalogue", loc, { ...draft, serviceCopy: { ...draft.serviceCopy, [id]: byLocale[loc] } }, user.id);
      }
    }
    if (publish && (user.role === "admin" || user.role === "owner")) {
      publishDoc("services", GLOBAL, user.id);
      if (Object.keys(copies).length) for (const loc of ["en", "ru", "hy"]) publishDoc("catalogue", loc, user.id);
      return { ok: true, hasDraft: false, message: "Published — prices are live." };
    }
    return { ok: true, hasDraft: true, message: Object.keys(copies).length ? "Draft saved, with the names of the new service in all three languages." : "Draft saved." };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: "Each new service needs a name in English, Russian and Armenian (2–120 characters)." };
    return fail(e);
  }
}

/* ───────── Portfolio projects ───────── */

const caseIntro = z.object({ name: z.string().trim().min(2).max(120), industry: z.string().trim().max(160), teaser: z.string().trim().max(200) });

export async function saveCasesDraft(json: string, newCopy: string, publish = false): Promise<CmsResult> {
  const user = await requireUser("manager");
  try {
    const list = JSON.parse(json) as unknown;
    const intros = z.record(z.string().regex(/^[a-z0-9][a-z0-9-]{1,48}$/), caseIntro).parse(JSON.parse(newCopy || "{}"));
    saveDraft("cases", GLOBAL, list, user.id);
    for (const [slug, intro] of Object.entries(intros)) {
      const st = docState(`case:${slug}`, "en");
      saveDraft(`case:${slug}`, "en", { ...(st.draft as object), ...intro }, user.id);
    }
    if (publish && (user.role === "admin" || user.role === "owner")) {
      publishDoc("cases", GLOBAL, user.id);
      for (const slug of Object.keys(intros)) publishDoc(`case:${slug}`, "en", user.id);
      return { ok: true, hasDraft: false, message: "Published — the portfolio is updated." };
    }
    return { ok: true, hasDraft: true, message: "Draft saved." };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: "A new project needs an English name (2–120 characters)." };
    return fail(e);
  }
}

/* ───────── Media ───────── */

export async function renameMedia(id: number, name: string): Promise<CmsResult> {
  const user = await requireUser("manager");
  const clean = z.string().trim().max(160).parse(name);
  run("UPDATE media SET name = ? WHERE id = ?", clean || null, z.number().int().positive().parse(id));
  audit("media.rename", { userId: user.id, entity: "media", entityId: id });
  return { ok: true };
}

/** Deletes an upload that no draft or published document uses. */
export async function deleteMedia(id: number): Promise<CmsResult> {
  const user = await requireUser("admin");
  const m = get<{ file: string }>("SELECT file FROM media WHERE id = ?", z.number().int().positive().parse(id));
  if (!m) return { ok: false, error: "Not found." };
  const url = `/media/${m.file}`;
  const used = all<{ key: string }>(
    "SELECT key FROM content_docs WHERE INSTR(COALESCE(published, ''), ?) > 0 OR INSTR(COALESCE(draft, ''), ?) > 0",
    url,
    url,
  );
  if (used.length) return { ok: false, error: `In use (${used.map((u) => u.key).join(", ")}). Remove it there first.` };
  run("DELETE FROM media WHERE id = ?", id);
  const file = path.join(dataDir(), "media", path.basename(m.file));
  rmSync(file, { force: true });
  audit("media.delete", { userId: user.id, entity: "media", entityId: id });
  return { ok: true, message: "Deleted." };
}
