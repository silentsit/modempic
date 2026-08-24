import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: { baseURL: "http://127.0.0.1:3000", trace: "on-first-retry" },
  webServer: {
    /** CI already ran `next build`; `next start` avoids mixing a production `.next` with `next dev`. */
    command: process.env.CI ? "npx next start -H 127.0.0.1 -p 3000" : "npm run dev",
    /** Avoid `/` — storefront pages need Postgres; health is always 200. */
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      DEV_PAYMENT_SIMULATE: process.env.DEV_PAYMENT_SIMULATE ?? "1",
      AUTH_URL: process.env.AUTH_URL ?? "http://127.0.0.1:3000",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000",
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
