import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { deflateSync } from "node:zlib";

/**
 * Content management: drafts stay private, preview shows them to the editor, publishing
 * makes them live, history restores, validation protects placeholders and links, prices and
 * uploads work. Runs against the throwaway .e2e-storage database.
 */

const OWNER = { name: "CMS Owner", email: "cms-owner@example.com", password: "a-long-test-passphrase-42" };
const STORAGE = process.env.E2E_STORAGE ?? ".e2e-storage";

async function signIn(page: Page) {
  await page.goto("/admin");
  if (page.url().includes("/admin/setup")) {
    const token = readFileSync(path.join(STORAGE, "setup-token.txt"), "utf8").trim();
    await page.locator('input[name="token"]').fill(token);
    await page.locator('input[name="name"]').fill(OWNER.name);
    await page.locator('input[name="email"]').fill(OWNER.email);
    await page.locator('input[name="password"]').fill(OWNER.password);
    await page.getByRole("button", { name: /create|set up|continue/i }).click();
    await page.waitForURL(/\/admin\/settings/);
    return;
  }
  if (page.url().includes("/admin/login")) {
    await page.locator('input[name="email"]').fill(OWNER.email);
    await page.locator('input[name="password"]').fill(OWNER.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/admin(\/|$)/);
  }
}

/** A tiny valid PNG (8×8, one colour) built in memory. */
function png(): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (b: Buffer) => {
    let c = 0xffffffff;
    for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(8, 0);
  ihdr.writeUInt32BE(8, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.concat(Array.from({ length: 8 }, () => Buffer.concat([Buffer.from([0]), Buffer.from(Array(8).fill([212, 255, 58]).flat())])));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

test.describe.configure({ mode: "serial" });

test.describe("CMS", () => {
  let admin: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.skip(!existsSync(STORAGE), "needs the e2e database folder");
    admin = await browser.newContext();
    page = await admin.newPage();
    await signIn(page);
  });

  test.afterAll(async () => {
    await admin?.close();
  });

  test("content overview lists every section with its languages", async () => {
    await page.goto("/admin/content");
    await expect(page.getByRole("heading", { name: "Website content" })).toBeVisible();
    for (const label of ["Home page", "Pricing page", "FAQ page", "Main menu", "Business website", "Amir Khaldari"]) {
      await expect(page.getByRole("link", { name: label, exact: false }).first()).toBeVisible();
    }
  });

  test("a draft is private, preview shows it, publishing makes it live", async ({ browser }) => {
    const NEW_LEAD = "Edited from the CMS: websites, apps and AI that work.";
    await page.goto("/admin/content/edit?doc=home&lang=en");
    const field = page.locator('[id="f-hero.lead-in"]');
    await field.fill(NEW_LEAD);
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Draft saved" })).toBeVisible();

    const visitor = await browser.newContext();
    const v = await visitor.newPage();
    await v.goto("/");
    await expect(v.locator("body")).not.toContainText(NEW_LEAD);

    await page.goto("/admin/preview?mode=on&next=/");
    await expect(page.locator("body")).toContainText(NEW_LEAD);
    await expect(page.locator(".cms-preview-bar")).toBeVisible();
    await page.goto("/admin/preview?mode=off&next=/");
    await expect(page.locator("body")).not.toContainText(NEW_LEAD);

    await page.goto("/admin/content/edit?doc=home&lang=en");
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByRole("status").filter({ hasText: /Published/ })).toBeVisible();
    await v.goto("/");
    await expect(v.locator("body")).toContainText(NEW_LEAD);

    // Russian shows the English reference and flags the changed field.
    await page.goto("/admin/content/edit?doc=home&lang=ru");
    const ru = page.locator('[id="f-hero.lead"]');
    await expect(ru).toContainText(NEW_LEAD);
    await expect(ru).toHaveAttribute("data-outdated", "true");
    await visitor.close();
  });

  test("history restores the previous version", async ({ browser }) => {
    await page.goto("/admin/content/edit?doc=home&lang=en");
    await page.getByText(/^History/).click();
    // The oldest entry is the original text.
    await page.getByRole("button", { name: "Restore as draft" }).last().click();
    await expect(page.getByRole("status").filter({ hasText: /original text/ })).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByRole("status").filter({ hasText: /Published/ })).toBeVisible();
    const visitor = await browser.newContext();
    const v = await visitor.newPage();
    await v.goto("/");
    await expect(v.locator("body")).toContainText("ONYQ designs and builds websites, apps and AI tools for business");
    await visitor.close();
  });

  test("interface strings keep their placeholders; links are checked", async () => {
    await page.goto("/admin/content/edit?doc=messages:common&lang=en");
    await page.locator('[id="f-fromDays-in"]').fill("from some days");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.locator(".a-cms-bar__err")).toContainText("placeholders");
    await expect(page.locator('[id="f-fromDays"]')).toHaveAttribute("data-error", "true");

    await page.goto("/admin/content/edit?doc=home&lang=en");
    await page.locator("summary", { hasText: /^Capabilities$/ }).click();
    await page.locator('[id="f-capabilities.stages.0.href-in"]').fill("javascript:alert(1)");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.locator(".a-cms-bar__err")).toContainText("link");
  });

  test("prices: change, hide and publish from Services & prices", async ({ browser }) => {
    await page.goto("/admin/content/services");
    await page.getByRole("spinbutton", { name: "Price of Landing page" }).fill("800");
    const row = page.locator(".a-cms-svc", { hasText: "ux-audit" });
    await row.getByRole("checkbox", { name: "visible" }).uncheck();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByRole("status").filter({ hasText: /Published/ })).toBeVisible();

    const visitor = await browser.newContext();
    const v = await visitor.newPage();
    await v.goto("/price");
    await expect(v.locator('#service-landing-page [data-price="landing-page"]')).toContainText("$800");
    await expect(v.locator("#service-ux-audit")).toHaveCount(0);
    await visitor.close();

    // Put the catalogue back for the other tests.
    await page.reload();
    await page.getByRole("spinbutton", { name: "Price of Landing page" }).fill("790");
    await page.locator(".a-cms-svc", { hasText: "ux-audit" }).getByRole("checkbox", { name: "visible" }).check();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByRole("status").filter({ hasText: /Published/ })).toBeVisible();
  });

  test("media: images are re-encoded to WebP, SVG and fake files are refused", async ({ request }) => {
    const origin = new URL(test.info().project.use.baseURL ?? "http://localhost:3200").origin;
    const state = await admin.storageState();
    const cookie = state.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const up = (name: string, type: string, buffer: Buffer) =>
      request.post("/admin/media-upload", { headers: { origin, cookie }, multipart: { file: { name, mimeType: type, buffer } } });

    const ok = await up("dot.png", "image/png", png());
    expect(ok.status()).toBe(200);
    const body = await ok.json();
    expect(body.url).toMatch(/^\/media\/[a-f0-9]{24}\.webp$/);
    const img = await request.get(body.url);
    expect(img.status()).toBe(200);
    expect(img.headers()["content-type"]).toBe("image/webp");
    expect(img.headers()["x-content-type-options"]).toBe("nosniff");

    const svg = await up("x.svg", "image/svg+xml", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'));
    expect(svg.status()).toBe(415);
    const fake = await up("x.mp4", "video/mp4", Buffer.from("not a video at all, just text"));
    expect(fake.status()).toBe(415);

    // Anonymous and cross-site uploads are refused.
    expect((await request.post("/admin/media-upload", { headers: { origin }, multipart: { file: { name: "a.png", mimeType: "image/png", buffer: png() } } })).status()).toBe(401);
    expect((await request.post("/admin/media-upload", { headers: { origin: "https://evil.example", cookie }, multipart: { file: { name: "a.png", mimeType: "image/png", buffer: png() } } })).status()).toBe(403);
    expect((await request.get("/media/../onyq.db")).status()).toBe(404);
  });

  test("visitors can't switch preview on, and preview redirects stay on this site", async ({ request }) => {
    const res = await request.get("/admin/preview?mode=on&next=/", { maxRedirects: 0 });
    expect(res.status()).toBe(303);
    expect(res.headers()["location"]).toContain("/admin/login");
    const r2 = await page.request.get("/admin/preview?mode=on&next=//evil.example/x", { maxRedirects: 0 });
    expect(new URL(r2.headers()["location"]).pathname).toBe("/");
    await page.request.get("/admin/preview?mode=off&next=/", { maxRedirects: 0 });
  });
});
