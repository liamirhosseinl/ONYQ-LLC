import { test, expect, type Page } from "@playwright/test";

/** Navigate and wait until the client bundle has hydrated (header effect sets the flag). */
async function gotoReady(page: Page, url: string) {
  await page.goto(url);
  await page.waitForFunction(() => (window as unknown as { __onyqMotionReady?: boolean }).__onyqMotionReady === true);
}

test.describe("navigation", () => {
  test("desktop Services menu: open, Escape returns focus, click outside closes", async ({ page }) => {
    await gotoReady(page, "/");
    const trigger = page.getByRole("button", { name: "Services" });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const panel = page.locator(".menu-panel:not([hidden])");
    await expect(panel.getByRole("link", { name: "Development" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.mouse.click(700, 700);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await page.getByRole("button", { name: "Studio" }).click();
    await page.locator(".menu-panel:not([hidden])").getByRole("link", { name: "How we work" }).click();
    await expect(page).toHaveURL(/\/how-we-work$/);
  });

  test("mobile drawer: open, expand Services, navigate, Escape closes", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await gotoReady(page, "/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Services" }).click();
    await expect(drawer.getByRole("link", { name: "Marketing" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: /Pricing/ }).click();
    await expect(page).toHaveURL(/\/price$/);
    await ctx.close();
  });
});

test.describe("pricing", () => {
  test("USD/AMD toggle updates every price consistently and is shareable", async ({ page }) => {
    await gotoReady(page, "/price");
    const landing = page.locator('#service-landing-page [data-price="landing-page"]');
    await expect(landing).toContainText("$790");
    await page.locator(".cat-nav").getByRole("button", { name: "֏ AMD" }).click();
    await expect(landing).toContainText("286,000 ֏");
    await expect(page.locator('[data-price][data-currency="USD"]')).toHaveCount(0);
    await expect(page).toHaveURL(/currency=amd/);
    await expect(page.getByRole("note").filter({ hasText: "362 ֏ per $1" }).first()).toBeVisible();
    await page.reload();
    await expect(landing).toContainText("286,000 ֏");
    await page.locator(".cat-nav").getByRole("button", { name: "$ USD" }).click();
    await expect(landing).toContainText("$790");
  });

  test("all 25 catalogue entries are listed with approved starting prices", async ({ page }) => {
    await gotoReady(page, "/price");
    await expect(page.locator(".price-row")).toHaveCount(25);
    const expectations: [string, string][] = [
      ["web-portal", "$9,900"],
      ["mobile-app", "$6,900"],
      ["seo", "$350/mo"],
      ["website-maintenance", "$99/mo"],
      ["ux-audit", "$290"],
    ];
    for (const [id, text] of expectations) await expect(page.locator(`#service-${id} [data-price]`)).toContainText(text);
  });

  test("no offer is shown while the promotion is disabled", async ({ page }) => {
    await gotoReady(page, "/price");
    await expect(page.locator('[data-promo="true"]')).toHaveCount(0);
    await expect(page.locator("[data-promo-notice]")).toHaveCount(0);
    await expect(page.getByText(/59%/)).toHaveCount(0);
  });

  test("the live site ignores ?promo=preview and shows no review markers", async ({ page }) => {
    // The promotion maths itself is covered by tests/unit/pricing.test.ts.
    await gotoReady(page, "/price?promo=preview");
    await expect(page.locator("[data-promo-notice]")).toHaveCount(0);
    await expect(page.locator('#service-landing-page [data-price]')).toContainText("$790");
    await expect(page.locator(".preview-ribbon")).toHaveCount(0);
    await expect(page.locator("[data-proposed], .proposed__tag")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Always included" })).toBeVisible();
  });
});

test.describe("brief flow", () => {
  async function fillBrief(page: import("@playwright/test").Page) {
    const dialog = page.getByRole("dialog", { name: "Project brief" });
    await dialog.getByRole("radio", { name: "An online store" }).check();
    await dialog.getByLabel("Describe the challenge").fill("We sell ceramics on Instagram and want a proper store.");
    await dialog.getByRole("button", { name: "Continue", exact: true }).click();
    await dialog.getByRole("radio", { name: /An existing product/ }).check();
    await dialog.getByRole("button", { name: "Continue", exact: true }).click();
    await dialog.getByRole("checkbox", { name: "Websites" }).check();
    await dialog.getByRole("button", { name: "Continue", exact: true }).click();
    await dialog.getByRole("radio", { name: "$5,000–15,000" }).check();
    await dialog.getByRole("button", { name: "Continue", exact: true }).click();
    await dialog.getByLabel("Name").fill("Ani");
    await dialog.getByLabel("Email").fill("ani@example.com");
    await dialog.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(dialog.getByRole("heading", { name: "Check your brief before sending" })).toBeVisible();
    return dialog;
  }

  test("validation blocks empty steps and explains what to fix", async ({ page }) => {
    await gotoReady(page, "/");
    await page.getByRole("button", { name: /Start a project/ }).click();
    const dialog = page.getByRole("dialog", { name: "Project brief" });
    await dialog.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(dialog.getByText("Choose the closest fit.")).toBeVisible();
    await expect(dialog.getByText("Describe the challenge in at least 10 characters.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: /Start a project/ })).toBeFocused();
  });

  test("a real brief is stored and confirmed (lands in the admin inbox)", async ({ page }) => {
    await gotoReady(page, "/");
    await page.getByRole("button", { name: /Start a project/ }).click();
    const dialog = await fillBrief(page);
    await dialog.getByRole("button", { name: /Send brief/ }).click();
    await expect(dialog.getByRole("heading", { name: "Brief sent" })).toBeVisible();
  });

  test("success state appears only after the API confirms delivery", async ({ page }) => {
    let body: Record<string, unknown> | null = null;
    await page.route("**/api/enquiry", async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });
    await gotoReady(page, "/price");
    await page.locator("#service-online-store").getByRole("button", { name: /Get a quote/ }).click();
    const dialog = page.getByRole("dialog", { name: "Project brief" });
    await expect(dialog.getByText("Interested in")).toBeVisible();
    await fillBrief(page);
    await dialog.getByRole("button", { name: /Send brief/ }).click();
    await expect(dialog.getByRole("heading", { name: "Brief sent" })).toBeVisible();
    expect(body).toMatchObject({ challengeType: "store", stage: "existing-product", email: "ani@example.com", serviceId: "online-store", budget: "5k-15k" });
  });

  test("delivery failure offers retry and keeps the brief", async ({ page }) => {
    await page.route("**/api/enquiry", (route) => route.fulfill({ status: 502, body: '{"ok":false}' }));
    await gotoReady(page, "/contacts");
    await page.getByRole("button", { name: /Start a project/ }).click();
    const dialog = await fillBrief(page);
    await dialog.getByRole("button", { name: /Send brief/ }).click();
    await expect(dialog.getByRole("alert")).toContainText("could not be delivered");
    await expect(dialog.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(dialog.getByText("ani@example.com").first()).toBeVisible();
  });

  test("API rejects invalid input server-side", async ({ request }) => {
    const origin = new URL(test.info().project.use.baseURL ?? "http://localhost:3200").origin;
    const crossSite = await request.post("/api/enquiry", { data: { email: "nope" } });
    expect(crossSite.status()).toBe(403);
    const invalid = await request.post("/api/enquiry", { data: { email: "nope" }, headers: { origin } });
    expect(invalid.status()).toBe(400);
  });

  test("letter composer writes the letter and continues into the brief", async ({ page }) => {
    await gotoReady(page, "/#start");
    const letter = page.locator(".letter");
    await letter.getByRole("radio", { name: "An online store" }).check();
    await expect(letter.locator(".letter__paper")).toContainText("We want to build an online store.");
    await letter.getByRole("button", { name: /What you need/ }).click();
    await letter.getByRole("checkbox", { name: "Marketing & promotion" }).check();
    await expect(letter.locator(".letter__paper")).toContainText("We need help with marketing & promotion.");
    await letter.getByRole("button", { name: /The first step/ }).click();
    await letter.getByRole("radio", { name: "In 1–3 months" }).check();
    await expect(letter.locator(".letter__paper")).toContainText("We’d like to start within one to three months.");
    await letter.getByRole("button", { name: /Continue this letter/ }).click();
    const dialog = page.getByRole("dialog", { name: "Project brief" });
    await expect(dialog.getByRole("radio", { name: "An online store" })).toBeChecked();
  });
});

test.describe("interactive sections", () => {
  test("value comparison works with mouse and keyboard", async ({ page }) => {
    await gotoReady(page, "/");
    const section = page.locator("section.value");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveAttribute("data-mode", "separate");
    await expect(section.locator(".nodes__you b")).toHaveText("6");
    await section.getByRole("button", { name: "ONYQ, end to end" }).click();
    await expect(section).toHaveAttribute("data-mode", "onyq");
    await expect(section.locator(".nodes__you b")).toHaveText("1");
    await page.keyboard.press("ArrowLeft");
    await expect(section).toHaveAttribute("data-mode", "separate");
  });

  test("story tabs move the pinned story to the chosen stage", async ({ page }) => {
    await gotoReady(page, "/");
    const story = page.locator("#studio");
    await story.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.getElementById("studio")!.offsetTop + 50));
    await expect(story).toHaveAttribute("data-stage", "0");
    await story.getByRole("button", { name: /Product/ }).click();
    await expect(story).toHaveAttribute("data-stage", "5", { timeout: 8000 });
    await expect(story.locator('.story__panel[data-active="true"]')).toContainText("it’s live");
  });

  test("FAQ accordion expands and collapses with aria-expanded", async ({ page }) => {
    await gotoReady(page, "/faq");
    const q = page.getByRole("button", { name: "How does a project start?" });
    await q.click();
    await expect(q).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("With a short brief", { exact: false }).first()).toBeVisible();
    await q.click();
    await expect(q).toHaveAttribute("aria-expanded", "false");
  });

  test("direction page tabs switch the explained discipline (arrow keys too)", async ({ page }) => {
    await gotoReady(page, "/ai");
    const tabs = page.getByRole("tablist");
    await tabs.getByRole("tab", { name: /Process automation/ }).click();
    await expect(page.getByRole("tabpanel")).toContainText("copying and pasting");
    await page.keyboard.press("ArrowDown");
    await expect(tabs.getByRole("tab", { name: /Integrations/ })).toHaveAttribute("aria-selected", "true");
  });

  test("reduced motion: no pinned stories, all panels readable", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await gotoReady(page, "/");
    expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBeUndefined();
    const story = page.locator("#studio");
    await expect(story).not.toHaveAttribute("data-enhanced", "true");
    for (const text of ["starts as a sentence", "talks to everything", "it’s live"]) await expect(story.getByText(text)).toBeVisible();
    await ctx.close();
  });
});

test.describe("theme & language", () => {
  test("theme toggle switches day/night and remembers the choice", async ({ page }) => {
    await gotoReady(page, "/");
    const html = page.locator("html");
    const before = await html.getAttribute("data-theme");
    await page.locator("header .theme-toggle").first().click();
    const after = before === "dark" ? "light" : "dark";
    await expect(html).toHaveAttribute("data-theme", after);
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", after);
  });

  test("language switcher keeps the current page", async ({ page }) => {
    await gotoReady(page, "/price");
    await page.locator("header .lang").first().getByRole("button", { name: "Հայերեն" }).click();
    await expect(page).toHaveURL(/\/hy\/price/);
    await expect(page.locator("html")).toHaveAttribute("lang", "hy");
  });
});

test.describe("language switch", () => {
  test("switching to RU and HY keeps theme and scroll animations alive", async ({ page }) => {
    for (const lang of ["ru", "hy"]) {
      await page.goto("/price");
      await page.waitForFunction(() => document.documentElement.dataset.motion === "full");
      await page.locator(`.lang--header .lang__btn[lang="${lang}"]`).click();
      await page.waitForURL(new RegExp(`/${lang}/price`));
      await page.waitForFunction(() => (window as unknown as { __onyqMotionReady?: boolean }).__onyqMotionReady === true);
      const html = page.locator("html");
      await expect(html).toHaveAttribute("lang", lang);
      await expect(html).toHaveAttribute("data-motion", "full");
      await expect(html).toHaveAttribute("data-theme", /light|dark/);
      await expect(html).not.toHaveAttribute("data-reveal-all", "true");
    }
  });
});
