import "server-only";
import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { run, get } from "./db.ts";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>;

/* ───────── Hashing & tokens ───────── */

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/* ───────── Passwords (scrypt, OWASP-recommended parameters) ───────── */

const SCRYPT = { N: 1 << 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

/**
 * Each scrypt call uses ~128 MB of memory. A small gate keeps a flood of sign-in attempts from
 * exhausting the server's memory: at most two hashes run at once, the rest wait their turn.
 */
let running = 0;
const waiting: (() => void)[] = [];
async function gated<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= 2) await new Promise<void>((r) => waiting.push(r));
  running++;
  try {
    return await fn();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await gated(() => scrypt(password.normalize("NFKC"), salt, 64, SCRYPT));
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  // Only accept the parameters we write (a tampered hash can't make us burn CPU/memory).
  if (Number(n) !== SCRYPT.N || Number(r) !== SCRYPT.r || Number(p) !== SCRYPT.p) return false;
  const expected = Buffer.from(hash, "base64");
  if (expected.length !== 64) return false;
  const key = await gated(() => scrypt(password.normalize("NFKC"), Buffer.from(salt, "base64"), expected.length, SCRYPT));
  return timingSafeEqual(key, expected);
}

/** Minimum policy (NIST SP 800-63B): length over composition rules, no obvious passwords. */
export function passwordProblem(password: string, email = ""): string | null {
  if (password.length < 12) return "Use at least 12 characters.";
  if (password.length > 200) return "Use at most 200 characters.";
  const lower = password.toLowerCase();
  if (email && lower.includes(email.split("@")[0].toLowerCase())) return "Don't include your email name.";
  if (/^(.)\1+$/.test(password) || ["password1234", "123456789012", "qwertyuiopas", "onyqonyqonyq"].includes(lower)) return "Choose a less predictable password.";
  return null;
}

/* ───────── TOTP (RFC 6238, SHA-1, 30 s, 6 digits) ───────── */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function newTotpSecret(): string {
  const bytes = randomBytes(20);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function b32decode(s: string): Buffer {
  let bits = "";
  for (const ch of s.replace(/=+$/, "").toUpperCase()) {
    const v = B32.indexOf(ch);
    if (v < 0) continue;
    bits += v.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function totpAt(secret: string, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", b32decode(secret)).update(buf).digest();
  const o = h[h.length - 1] & 0xf;
  const code = ((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
  return code;
}

/**
 * Checks a 6-digit code (±1 time step for clock drift). Returns the matched time step, or 0.
 * Callers pass the last step already used and store the returned one, so a code can't be
 * replayed (RFC 6238 §5.2).
 */
export function verifyTotp(secret: string, code: string, lastStep = 0, now = Date.now()): number {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return 0;
  const step = Math.floor(now / 30_000);
  for (const d of [-1, 0, 1]) {
    const s = step + d;
    if (s > lastStep && safeEqual(totpAt(secret, s), clean)) return s;
  }
  return 0;
}

export function totpUri(secret: string, email: string): string {
  return `otpauth://totp/ONYQ%20Admin:${encodeURIComponent(email)}?secret=${secret}&issuer=ONYQ%20Admin&algorithm=SHA1&digits=6&period=30`;
}

/* ───────── Requests ───────── */

/**
 * Client IP, used only for rate limits and the daily-salted visitor hash.
 *
 * Forwarding headers are trusted ONLY when ONYQ_TRUST_PROXY=1, i.e. when the app sits behind our
 * reverse proxy (Caddy/nginx), which overwrites them. Without it, anyone talking to the app
 * directly could forge a new "IP" on every request and walk around the limits, so all such
 * traffic shares one bucket instead (fail closed). CF-Connecting-IP additionally needs
 * ONYQ_TRUST_CLOUDFLARE=1.
 */
export function clientIp(headers: Headers): string {
  if (process.env.ONYQ_TRUST_PROXY !== "1") return "direct";
  const ip =
    (process.env.ONYQ_TRUST_CLOUDFLARE === "1" ? headers.get("cf-connecting-ip") : null) ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return ip.slice(0, 64);
}

/** Same-origin check for state-changing requests (defence in depth on top of SameSite cookies). */
export function sameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  const host = (process.env.ONYQ_TRUST_PROXY === "1" && headers.get("x-forwarded-host")) || headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Sliding-window rate limit stored in SQLite, so it holds across restarts. */
export function rateLimited(bucket: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  run("DELETE FROM rate_limits WHERE bucket = ? AND ts < ?", bucket, now - windowMs);
  const row = get<{ n: number }>("SELECT COUNT(*) AS n FROM rate_limits WHERE bucket = ?", bucket);
  if ((row?.n ?? 0) >= limit) return true;
  run("INSERT INTO rate_limits (bucket, ts) VALUES (?, ?)", bucket, now);
  // Occasionally sweep old rows from every bucket.
  if (Math.random() < 0.01) run("DELETE FROM rate_limits WHERE ts < ?", now - 24 * 3600_000);
  return false;
}

/** Reject oversized bodies before parsing them. */
export async function readJson(request: Request, maxBytes: number): Promise<unknown | undefined> {
  const len = Number(request.headers.get("content-length") || "0");
  if (len > maxBytes) return undefined;
  // Read the body as a stream and stop at the cap, so a chunked upload with no length can't
  // make the server buffer megabytes.
  if (!request.body) return undefined;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      return undefined;
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return undefined;
  }
}

/** A site-relative path that can never become an off-site link ("//x", "/\\x", schemes, control chars). */
export function isSafePath(p: string): boolean {
  return /^\/(?![\/\\])[A-Za-z0-9\-._~%!$&'()*+,;=:@/]*$/.test(p) && !/%(?:[01][0-9a-f]|7f)/i.test(p) && p.length <= 300;
}
