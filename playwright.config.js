import { defineConfig } from "@playwright/test";
// Edge ships with Windows; elsewhere use Playwright's bundled Chromium
// (`npx playwright install chromium`). Override with PW_CHANNEL if needed.
const channel =
  process.env.PW_CHANNEL ??
  (process.platform === "win32" ? "msedge" : undefined);
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:5173",
    browserName: "chromium",
    channel,
    headless: true,
  },
  webServer: {
    command: "npx vite --host 127.0.0.1 --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
});
