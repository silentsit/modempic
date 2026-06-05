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

test("public SEO pages return crawlable HTML", async ({ request }) => {
  test.setTimeout(90_000);
  for (const path of ["/", "/shop", "/faq", "/blog"]) {
    const res = await request.get(path, { timeout: 60_000 });
    expect(res.ok(), `${path} should return 2xx`).toBeTruthy();
    const html = await res.text();
    expect(html, `${path} should include canonical metadata`).toContain('rel="canonical"');
    expect(html, `${path} should include visible page text`).toMatch(/Modempic|Shop|FAQ|Blog/i);
  }
});

test("shop search URLs are noindexed", async ({ request }) => {
  const res = await request.get("/shop?query=modafinil");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["x-robots-tag"]).toContain("noindex");
});

test("sitemap and robots are available", async ({ request }) => {
  const [sitemap, robots] = await Promise.all([request.get("/sitemap.xml"), request.get("/robots.txt")]);

  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("/shop");

  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toMatch(/Sitemap:/i);
});

