import { defineConfig } from "@playwright/test";
// The tests answer every /api/ call with a small fake API (tests/fake-api.js),
// so they do not need the backend to run.
// They start their own dev server on port 5287, so they never test a
// different app that may already run on the normal port 5200.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:5287",
    browserName: "chromium",
    channel: "msedge",
    headless: true,
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5287",
    url: "http://127.0.0.1:5287",
    reuseExistingServer: false,
  },
});
