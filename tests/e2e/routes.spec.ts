import { test, expect } from "@playwright/test";

const ROUTES = [
  "/",
  "/services",
  "/design",
  "/development",
  "/ai",
  "/mobile-apps",
  "/marketing",
  "/gamification",
  "/business-analytics",
  "/financial-consulting",
  "/services/landing-page",
  "/services/website-redesign",
  "/services/corporate-website",
  "/services/online-store",
  "/services/integrations-payments",
  "/services/website-maintenance",
  "/services/branding",
  "/services/ux-ui-design",
  "/services/telegram-bot",
  "/services/ai-assistant",
  "/services/seo",
  "/services/search-ads",
  "/services/smm",
  "/services/website-audit",
  "/price",
  "/portfolio",
  "/about",
  "/how-we-work",
  "/faq",
  "/contacts",
  "/portfolio/vihan-school",
  "/portfolio/eagle-vpn",
  "/portfolio/english-institute",
  "/portfolio/amir-khaldari",
  "/content",
  "/hy/content",
  "/ru",
  "/ru/price",
  "/ru/portfolio/vihan-school",
  "/ru/services/online-store",
  "/hy",
  "/hy/price",
  "/hy/portfolio/eagle-vpn",
  "/hy/services/smm",
];

test.describe("routes", () => {
  for (const route of ROUTES) {
    test(`${route} renders directly with one h1 and no runtime errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/ONYQ/);
      expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toContain(route === "/" ? "" : route);
      expect(errors).toEqual([]);
    });
  }

  test("translated pages declare their language and hreflang alternates", async ({ page }) => {
    for (const [route, lang] of [["/ru", "ru"], ["/hy/price", "hy"], ["/portfolio", "en"]] as const) {
      await page.goto(route);
      expect(await page.locator("html").getAttribute("lang")).toBe(lang);
      await expect(page.locator('link[rel="alternate"][hreflang="hy"]')).toHaveCount(1);
    }
  });

  test("case studies hide clients under NDA", async ({ page }) => {
    await page.goto("/portfolio/english-institute");
    expect((await page.content()).toLowerCase()).not.toContain("iranzamin");
    await page.goto("/portfolio/vihan-school");
    await expect(page.getByRole("link", { name: /fatemeh\.me/ })).toBeVisible();
  });

  test("unknown routes return a branded 404 with working navigation", async ({ page }) => {
    const res = await page.goto("/this/does/not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page doesn’t exist.");
    await page.getByRole("link", { name: /Back to home/ }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("legal routes are not published until ONYQ supplies documents", async ({ page }) => {
    for (const r of ["/privacy-policy", "/terms", "/cancellation"]) {
      const res = await page.goto(r);
      expect(res?.status(), r).toBe(404);
    }
  });

  test("sitemap and robots are served; the live site is indexable except admin and API", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const xml = await sitemap.text();
    expect(xml).toContain("/services/landing-page");
    expect(xml).not.toContain("/privacy-policy");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Sitemap: https://onyq.am/sitemap.xml");
  });

  test("no reference-site branding, contacts or identifiers leak into pages", async ({ page }) => {
    for (const route of ["/", "/price", "/services/online-store", "/contacts", "/about"]) {
      await page.goto(route);
      const html = (await page.content()).toLowerCase();
      for (const banned of ["arevian", "hello@arevian", "03037538", "nut valley", "keri.am", "syrnik", "luma"]) {
        expect(html, `${route} contains ${banned}`).not.toContain(banned);
      }
    }
  });

  test("no dead links: every internal link on key pages resolves", async ({ page, request }) => {
    const seen = new Set<string>();
    for (const route of ["/", "/price", "/services", "/faq", "/services/seo"]) {
      await page.goto(route);
      const hrefs = await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href") || ""));
      for (const href of hrefs) {
        expect(href, `empty or placeholder href on ${route}`).not.toMatch(/^#?$/);
        if (!href.startsWith("/") || seen.has(href.split("#")[0])) continue;
        const path = href.split("#")[0];
        seen.add(path);
        const res = await request.get(path);
        expect(res.status(), `${path} linked from ${route}`).toBe(200);
      }
    }
  });
});
