import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  timeout: 300_000, // 5 min per test
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "brave",
      use: {
        executablePath:
          "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
        headless: process.env.HEADLESS === "1",
        viewport: { width: 1440, height: 900 },
        launchOptions: {
          args: [
            "--disable-blink-features=AutomationControlled",
            "--no-first-run",
            "--no-default-browser-check",
          ],
        },
      },
    },
    {
      name: "chromium",
      use: {
        headless: process.env.HEADLESS === "1",
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: "npx vite --port 5173 --host",
    port: 5173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
