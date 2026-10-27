import { test, expect } from "@playwright/test";

/** Brief §2.3 viewports. Screenshots are written to test-results/screens for review. */
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1280", width: 1280, height: 800 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
  { name: "360", width: 360, height: 800 },
];

const PAGES = ["/", "/price", "/services/online-store", "/development", "/contacts", "/faq", "/portfolio", "/portfolio/vihan-school", "/hy", "/ru/price", "/hy/services/online-store"];

for (const vp of VIEWPORTS) {
  test(`no horizontal overflow and screenshots at ${vp.name}`, async ({ browser }) => {
    const mobile = vp.width < 768;
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForTimeout(1800);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} overflows at ${vp.name}`).toBeLessThanOrEqual(0);
      // body uses overflow-x: clip, so also check for content that is wider than the viewport.
      const wide = await page.evaluate(() =>
        Array.from(document.querySelectorAll("main *"))
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            // Content clipped by an overflow-hidden ancestor that itself fits is not visible overflow.
            let anc = el.parentElement;
            while (anc && anc !== document.body) {
              const cs = getComputedStyle(anc);
              if (/(hidden|clip)/.test(cs.overflowX) && anc.getBoundingClientRect().right <= window.innerWidth + 1) return false;
              anc = anc.parentElement;
            }
            return r.width > 0 && r.right > window.innerWidth + 1 && s.position !== "fixed" && // Elements still waiting for their scroll reveal sit offset by design.
              !el.closest("[data-reveal]:not([data-inview]), [data-reveal-stagger]:not([data-inview]), .marquee") &&
              !el.closest("[aria-hidden='true'], .cat-nav nav, .brief__steps, .hero, .origin, .horizon, .story__visual, .plates, .concept__visual");
          })
          .slice(0, 3)
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} → ${Math.round(el.getBoundingClientRect().right)}`),
      );
      expect(wide, `${path} has content wider than the viewport at ${vp.name}`).toEqual([]);
      const slug = path === "/" ? "home" : path.replaceAll("/", "_").slice(1);
      await page.screenshot({ path: `test-results/screens/${vp.name}-${slug}.png` });
    }
    // Footer and menu states
    await page.goto("/");
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await page.waitForTimeout(800);
    await page.screenshot({ path: `test-results/screens/${vp.name}-footer.png` });
    // The header hides while scrolling down (reference behaviour); scrolling up reveals it.
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(500);
    if (vp.width <= 1150) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `test-results/screens/${vp.name}-menu.png` });
    } else {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.getByRole("button", { name: "Services" }).click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `test-results/screens/${vp.name}-menu.png` });
    }
    await ctx.close();
  });
}
