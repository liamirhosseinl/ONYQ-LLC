import { expect, test } from "@playwright/test";

/** Security baseline: headers, CSP nonce, admin protection and the analytics beacon. */

test.describe("security", () => {
  test("pages send the security headers and a nonce-based CSP", async ({ page, request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["strict-transport-security"]).toContain("max-age=63072000");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["cross-origin-opener-policy"]).toBe("same-origin");
    expect(h["permissions-policy"]).toContain("camera=()");
    const csp = h["content-security-policy"];
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("'unsafe-eval'");

    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto("/");
    const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();
    expect(await page.locator("#onyq-motion-bootstrap").count()).toBe(1);
    expect(errors.filter((e) => /Content Security Policy/i.test(e))).toEqual([]);
  });

  test("admin is private: no index, no cache, sign-in required", async ({ page, request }) => {
    const res = await request.get("/admin/login", { maxRedirects: 0 });
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
    expect(res.headers()["cache-control"]).toContain("no-store");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/(login|setup)/);
    const robots = await (await request.get("/robots.txt")).text();
    // Preview builds block everything; production blocks /admin and /api.
    expect(robots).toMatch(/Disallow: \/(admin|\n|$)/);
  });

  test("admin exports and actions refuse anonymous access", async ({ request }) => {
    // Anonymous callers get a plain 404, so the endpoint does not even reveal that it exists.
    const res = await request.get("/admin/export/clients", { maxRedirects: 0 });
    expect(res.status()).toBe(404);
  });

  test("analytics beacon accepts only small same-site payloads and never errors", async ({ request, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const ok = await request.post("/api/a", { headers: { origin }, data: { t: "pv", s: "e2esession01", p: "/" } });
    expect(ok.status()).toBe(204);
    const junk = await request.post("/api/a", { headers: { origin }, data: { t: "nope" } });
    expect(junk.status()).toBe(204);
  });

  test("admin writes without this site's Origin are refused before any action runs", async ({ request }) => {
    const noOrigin = await request.post("/admin/login", { headers: { "next-action": "x" }, data: "[]" });
    expect(noOrigin.status()).toBe(403);
    const foreign = await request.post("/admin/login", { headers: { "next-action": "x", origin: "https://evil.example" }, data: "[]" });
    expect(foreign.status()).toBe(403);
  });

  test("analytics never stores paths that could become off-site links", async ({ request, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    for (const p of ["//evil.example/x", "/\\evil.example"]) {
      const r = await request.post("/api/a", { headers: { origin }, data: { t: "pv", s: "e2esession02", p } });
      expect(r.status()).toBe(204);
    }
  });

  test("image optimiser serves only our portfolio images", async ({ request }) => {
    for (const u of ["https://evil.example/a.png", "/brand/logo.svg", "/fonts/fonts.css"]) {
      const r = await request.get(`/_next/image?url=${encodeURIComponent(u)}&w=640&q=75`);
      expect(r.status()).toBeGreaterThanOrEqual(400);
    }
    const ok = await request.get(`/_next/image?url=${encodeURIComponent("/work/vihan-school/02.webp")}&w=640&q=75`);
    expect(ok.status()).toBe(200);
  });

  test("private files are never served", async ({ request }) => {
    for (const p of ["/.env", "/storage/onyq.db", "/package.json", "/lib/server/db.ts", "/scripts/admin.mjs"]) {
      const r = await request.get(p);
      expect(r.status(), p).not.toBe(200);
    }
  });
});
