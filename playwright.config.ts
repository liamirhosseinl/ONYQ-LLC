import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3200);
const BASE = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
// Use a system/preinstalled Chromium when PLAYWRIGHT_CHROMIUM_PATH is set (CI images, sandboxes).
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  outputDir: "test-results",
  use: {
    baseURL: BASE,
    trace: "off",
    // --no-proxy-server: keep the test browser from phoning home (updates, sync) through a proxy.
    launchOptions: { ...(executablePath ? { executablePath } : {}), args: ["--no-proxy-server", "--disable-background-networking", "--disable-component-update", "--no-first-run"] },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx next start -p ${PORT}`,
        // A throwaway database for the run, so tests never touch real data.
        env: { ONYQ_DATA_DIR: ".e2e-storage" },
        url: BASE,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
