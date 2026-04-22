import { test, expect } from "@playwright/test";

/** `request` only — no browser binary (`npx playwright install`) required. */
test("login page returns HTML (no Prisma on this route)", async ({ request }) => {
  const res = await request.get("/login");
  expect(res.ok()).toBeTruthy();
  const text = await res.text();
  expect(text).toMatch(/sign in/i);
});

test("api health", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const json = (await res.json()) as { ok: boolean };
  expect(json.ok).toBe(true);
});

