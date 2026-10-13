import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against a live API and a live web server (see .github/workflows/ci.yml, or start both locally):
 *   E2E_API_URL    default http://localhost:3000
 *   E2E_BASE_URL   default http://localhost:3001
 * Every test registers its own organization through the API, so tests never share data and can run in parallel.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
