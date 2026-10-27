import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

// Isolated database for this test file.
process.env.ONYQ_DATA_DIR = mkdtempSync(path.join(tmpdir(), "onyq-sec-"));

const sec = await import("../../lib/server/security.ts");
const { enquirySchema } = await import("../../lib/enquiry-schema.ts");

test("TOTP: right code accepted once, replay and wrong codes refused", () => {
  const secret = sec.newTotpSecret();
  const now = Date.now();
  const step = Math.floor(now / 30_000);
  const code = sec.totpAt(secret, step);
  const used = sec.verifyTotp(secret, code, 0, now);
  assert.equal(used, step);
  assert.equal(sec.verifyTotp(secret, code, used, now), 0, "same code can't be used twice");
  const wrong = String((Number(code) + 1) % 1_000_000).padStart(6, "0");
  assert.equal(sec.verifyTotp(secret, wrong, 0, now) === step, false, "a wrong code is refused");
  assert.equal(sec.verifyTotp(secret, "12345", 0, now), 0);
  assert.equal(sec.verifyTotp(secret, sec.totpAt(secret, step - 3), 0, now), 0, "old codes expire");
});

test("passwords: scrypt round-trip, tampered parameters refused", async () => {
  const h = await sec.hashPassword("correct horse battery");
  assert.match(h, /^scrypt\$131072\$8\$1\$/);
  assert.equal(await sec.verifyPassword("correct horse battery", h), true);
  assert.equal(await sec.verifyPassword("wrong horse battery", h), false);
  const weak = h.replace("$131072$", "$1024$");
  assert.equal(await sec.verifyPassword("correct horse battery", weak), false);
  assert.equal(sec.passwordProblem("short"), "Use at least 12 characters.");
  assert.equal(sec.passwordProblem("amir-is-the-owner-2026", "amir@onyq.am"), "Don't include your email name.");
});

test("client IP: forwarding headers trusted only behind our proxy", () => {
  const h = new Headers({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "7.7.7.7", "cf-connecting-ip": "8.8.8.8" });
  delete process.env.ONYQ_TRUST_PROXY;
  assert.equal(sec.clientIp(h), "direct", "spoofable headers ignored by default");
  process.env.ONYQ_TRUST_PROXY = "1";
  assert.equal(sec.clientIp(h), "7.7.7.7");
  process.env.ONYQ_TRUST_CLOUDFLARE = "1";
  assert.equal(sec.clientIp(h), "8.8.8.8");
  delete process.env.ONYQ_TRUST_PROXY;
  delete process.env.ONYQ_TRUST_CLOUDFLARE;
});

test("same-origin check", () => {
  assert.equal(sec.sameOrigin(new Headers({ origin: "https://onyq.am", host: "onyq.am" })), true);
  assert.equal(sec.sameOrigin(new Headers({ origin: "https://evil.am", host: "onyq.am" })), false);
  assert.equal(sec.sameOrigin(new Headers({ host: "onyq.am" })), false);
  assert.equal(sec.sameOrigin(new Headers({ origin: "https://evil.am", host: "onyq.am", "x-forwarded-host": "evil.am" })), false, "X-Forwarded-Host ignored unless behind our proxy");
});

test("safe paths: never an off-site link", () => {
  for (const ok of ["/", "/ru/price", "/portfolio/vihan-school", "/a%20b"]) assert.equal(sec.isSafePath(ok), true, ok);
  for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "/a\nb", "/a b", "x", "/%0d%0aSet-Cookie:x=1"]) assert.equal(sec.isSafePath(bad), false, bad);
  assert.equal(enquirySchema.parse({ challengeType: "website", challenge: "A new website please", stage: "new-idea", name: "Ani", email: "a@b.am", page: "//evil.com" }).page, undefined);
});

test("JSON bodies are capped while streaming (no Content-Length)", async () => {
  const big = new ReadableStream({
    start(c) {
      for (let i = 0; i < 64; i++) c.enqueue(new TextEncoder().encode("a".repeat(1024)));
      c.close();
    },
  });
  const r = new Request("http://x/", { method: "POST", body: big, duplex: "half" } as RequestInit);
  assert.equal(await sec.readJson(r, 4096), undefined);
  const ok = new Request("http://x/", { method: "POST", body: '{"a":1}' });
  assert.deepEqual(await sec.readJson(ok, 4096), { a: 1 });
});

test("rate limits count per bucket and expire", () => {
  const b = `t:${Math.random()}`;
  for (let i = 0; i < 3; i++) assert.equal(sec.rateLimited(b, 3, 60_000), false);
  assert.equal(sec.rateLimited(b, 3, 60_000), true);
  assert.equal(sec.rateLimited(b + "x", 3, 60_000), false);
});

test("recovery tool: temporary password works with the app and forces a change", async () => {
  const dir = process.env.ONYQ_DATA_DIR!;
  const { run, get } = await import("../../lib/server/db.ts");
  run("INSERT INTO users (email, name, role, password_hash, created_at) VALUES ('owner@onyq.test', 'Owner', 'owner', 'x', 0)");
  const out = execFileSync(process.execPath, ["--disable-warning=ExperimentalWarning", "scripts/admin.mjs", "reset-password", "owner@onyq.test"], { env: { ...process.env, ONYQ_DATA_DIR: dir }, encoding: "utf8" });
  const pw = out.match(/([A-Z2-9]{5}-){3}[A-Z2-9]{5}/)![0];
  const u = get<{ password_hash: string; must_change_password: number }>("SELECT password_hash, must_change_password FROM users WHERE email = 'owner@onyq.test'")!;
  assert.equal(await sec.verifyPassword(pw, u.password_hash), true);
  assert.equal(u.must_change_password, 1);
  const list = execFileSync(process.execPath, ["--disable-warning=ExperimentalWarning", "scripts/admin.mjs", "users"], { env: { ...process.env, ONYQ_DATA_DIR: dir }, encoding: "utf8" });
  assert.match(list, /owner@onyq\.test.*temporary password/);
});
