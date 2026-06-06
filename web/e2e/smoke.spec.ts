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
  const json = (await res.json()) as {
    ok: boolean;
    db: { reachable: boolean };
    payments: { btcpayConfigured: boolean; paymentoConfigured: boolean };
    webhooks: { recentFailures7d: number };
  };
  expect(json.ok).toBe(true);
  expect(json.db.reachable).toBe(true);
  expect(typeof json.payments.btcpayConfigured).toBe("boolean");
  expect(typeof json.webhooks.recentFailures7d).toBe("number");
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
  const sitemapXml = await sitemap.text();
  expect(sitemapXml).toContain("/shop");
  expect(sitemapXml).not.toContain("/research/");

  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toMatch(/Sitemap:/i);
});

test("checkout and order confirmation require sign-in", async ({ request }) => {
  const checkout = await request.get("/checkout");
  expect(checkout.ok(), "/checkout should render the account-required checkout page").toBeTruthy();
  expect(checkout.url()).toContain("/checkout");
  expect(await checkout.text()).toMatch(/sign in to finish|create account/i);

  const confirmation = await request.get("/order/TEST-ORDER/confirmation");
  expect(confirmation.ok(), "order confirmation should resolve to sign-in flow").toBeTruthy();
  expect(confirmation.url()).toContain("/login");
  expect(await confirmation.text()).toMatch(/sign in/i);
});

test("retired category slugs return 404", async ({ request }) => {
  for (const slug of ["peptides", "vitamins", "skin-care", "antiparasitic"]) {
    const res = await request.get(`/shop/${slug}`);
    expect(res.status(), `/shop/${slug} should be hidden`).toBe(404);
  }
});

