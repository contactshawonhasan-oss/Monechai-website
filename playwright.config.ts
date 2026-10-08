import { defineConfig } from "@playwright/test";

// E2E deletes its own fixtures and creates a temporary shipping zone. Never aim it at
// a shared, remote or production database; require an explicitly named local test DB.
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error("Set TEST_DATABASE_URL to a dedicated local monechai_test database before running E2E");
const target = new URL(testUrl);
if (!(["postgres:", "postgresql:"].includes(target.protocol) && ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) && target.pathname === "/monechai_test")) {
  throw new Error("TEST_DATABASE_URL must point to local /monechai_test (never a shared database)");
}

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 90_000,
  use: { baseURL: "http://127.0.0.1:3104", browserName: "chromium", channel: "chromium", headless: true },
  webServer: { command: "npm run dev -- -p 3104 --hostname 127.0.0.1", url: "http://127.0.0.1:3104/api/health", timeout: 60_000, reuseExistingServer: false,
    env: { DATABASE_URL: testUrl, DATABASE_SSL: process.env.DATABASE_SSL ?? "disable" } },
});
