import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { can, getUser } from "@/lib/server/auth.ts";
import { dataDir, run } from "@/lib/server/db.ts";
import { audit } from "@/lib/server/audit.ts";
import { clientIp, rateLimited } from "@/lib/server/security.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE = 25 * 1024 * 1024;
const MAX_VIDEO = 80 * 1024 * 1024;

/**
 * POST /admin/media-upload (multipart, field "file") — managers and above.
 * proxy.ts already refuses cross-site posts to /admin. Images are decoded and re-encoded to
 * WebP (max 2400 px wide), which strips metadata and anything hidden in the file; SVG is
 * refused. Videos must really be MP4 or WebM (checked by their first bytes) and are stored as is.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user || !can(user, "manager")) return NextResponse.json({ ok: false, error: "Sign in again." }, { status: 401 });
  const ip = clientIp(request.headers);
  if (rateLimited(`upload:${user.id}`, 60, 60 * 60_000)) return NextResponse.json({ ok: false, error: "Too many uploads — wait a little." }, { status: 429 });
  const length = Number(request.headers.get("content-length") || 0);
  if (!length || length > MAX_VIDEO + 1024 * 1024) return NextResponse.json({ ok: false, error: "The file is too large (images up to 25 MB, videos up to 80 MB)." }, { status: 413 });

  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get("file");
    file = f instanceof File ? f : null;
  } catch {
    file = null;
  }
  if (!file) return NextResponse.json({ ok: false, error: "No file received." }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 120) || null;
  const dir = path.join(dataDir(), "media");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const id = randomBytes(12).toString("hex");

  const isMp4 = buf.length > 12 && buf.subarray(4, 8).toString("latin1") === "ftyp";
  const isWebm = buf.length > 4 && buf.readUInt32BE(0) === 0x1a45dfa3;
  if (isMp4 || isWebm) {
    if (buf.length > MAX_VIDEO) return NextResponse.json({ ok: false, error: "Videos can be up to 80 MB." }, { status: 413 });
    const ext = isMp4 ? "mp4" : "webm";
    const fileName = `${id}.${ext}`;
    writeFileSync(path.join(dir, fileName), buf, { mode: 0o600 });
    run(
      "INSERT INTO media (file, kind, mime, width, height, bytes, name, created_at, user_id) VALUES (?, 'video', ?, NULL, NULL, ?, ?, ?, ?)",
      fileName,
      isMp4 ? "video/mp4" : "video/webm",
      buf.length,
      name,
      Date.now(),
      user.id,
    );
    audit("media.upload", { userId: user.id, entity: "media", entityId: fileName, ip });
    return NextResponse.json({ ok: true, url: `/media/${fileName}`, kind: "video" });
  }

  if (buf.length > MAX_IMAGE) return NextResponse.json({ ok: false, error: "Images can be up to 25 MB." }, { status: 413 });
  try {
    const meta = await sharp(buf, { limitInputPixels: 80_000_000 }).metadata();
    if (!meta.format || !["jpeg", "png", "webp", "avif", "heif", "gif", "tiff"].includes(meta.format)) {
      return NextResponse.json({ ok: false, error: "Use a JPG, PNG, WebP or AVIF image." }, { status: 415 });
    }
    const { data, info } = await sharp(buf, { limitInputPixels: 80_000_000 })
      .rotate()
      .resize({ width: 2400, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer({ resolveWithObject: true });
    const fileName = `${id}.webp`;
    writeFileSync(path.join(dir, fileName), data, { mode: 0o600 });
    run(
      "INSERT INTO media (file, kind, mime, width, height, bytes, name, created_at, user_id) VALUES (?, 'image', 'image/webp', ?, ?, ?, ?, ?, ?)",
      fileName,
      info.width,
      info.height,
      data.length,
      name,
      Date.now(),
      user.id,
    );
    audit("media.upload", { userId: user.id, entity: "media", entityId: fileName, ip });
    return NextResponse.json({ ok: true, url: `/media/${fileName}`, kind: "image", width: info.width, height: info.height });
  } catch {
    return NextResponse.json({ ok: false, error: "This file isn’t a readable image." }, { status: 415 });
  }
}
