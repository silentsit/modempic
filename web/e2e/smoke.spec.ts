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
    payments: { peptidepayConfigured: boolean; paymentoConfigured: boolean };
    webhooks: { recentFailures7d: number };
  };
  expect(json.ok).toBe(true);
  expect(json.db.reachable).toBe(true);
  expect(typeof json.payments.peptidepayConfigured).toBe("boolean");
  expect(typeof json.payments.paymentoConfigured).toBe("boolean");
  expect(typeof json.webhooks.recentFailures7d).toBe("number");
});

test("public SEO pages return crawlable HTML", async ({ request }) => {
  test.setTimeout(90_000);
  for (const path of ["/", "/shop", "/faq", "/blog"]) {
    const res = await request.get(path, { timeout: 60_000 });
    expect(res.ok(), `${path} should return 2xx`).toBeTruthy();
    const html = await res.text();
    expect(html, `${path} should include canonical metadata`).toContain('rel="canonical"');
    expect(html, `${path} should include og:image`).toContain('property="og:image"');
    expect(html, `${path} should include visible page text`).toMatch(/Modempic|Shop|FAQ|Blog/i);
  }
});

test("shop search URLs are noindexed", async ({ request }) => {
  const res = await request.get("/shop?query=modafinil");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["x-robots-tag"]).toContain("noindex");
});

test("sitemap and robots are available", async ({ request }) => {
  const [index, pages, robots] = await Promise.all([
    request.get("/sitemap.xml"),
    request.get("/page-sitemap.xml"),
    request.get("/robots.txt"),
  ]);

  expect(index.ok()).toBeTruthy();
  const indexXml = await index.text();
  expect(indexXml).toContain("<sitemapindex");
  expect(indexXml).toContain("/page-sitemap.xml");
  expect(indexXml).toContain("/product-sitemap.xml");
  expect(indexXml).toContain("sitemap.xsl");

  expect(pages.ok()).toBeTruthy();
  const pagesXml = await pages.text();
  expect(pagesXml).toContain("/shop");
  expect(pagesXml).not.toContain("/research/");
  expect(pagesXml).toMatch(/<loc>https?:\/\/[^/<]+<\/loc>/);
  expect(pagesXml).not.toMatch(/<loc>https?:\/\/[^/<]+\/<\/loc>/);

  expect(robots.ok()).toBeTruthy();
  const robotsText = await robots.text();
  expect(robotsText).toMatch(/Sitemap:/i);
  expect(robotsText).toContain("Content-Signal: ai-train=no, search=yes, ai-input=no");
});

test("auth.md and OAuth discovery documents are published", async ({ request }) => {
  const [authMd, prm, as] = await Promise.all([
    request.get("/auth.md"),
    request.get("/.well-known/oauth-protected-resource"),
    request.get("/.well-known/oauth-authorization-server"),
  ]);

  expect(authMd.ok()).toBeTruthy();
  expect(authMd.headers()["content-type"]).toMatch(/markdown|plain/i);
  const md = await authMd.text();
  expect(md).toMatch(/^# auth\.md\b/m);

  expect(prm.ok()).toBeTruthy();
  const prmJson = (await prm.json()) as {
    resource: string;
    authorization_servers: string[];
    scopes_supported: string[];
    bearer_methods_supported: string[];
    agent_auth?: { skill: string; register_uri: string };
  };
  expect(prmJson.resource).toMatch(/\/$/);
  expect(prmJson.authorization_servers.length).toBeGreaterThan(0);
  expect(prmJson.scopes_supported.length).toBeGreaterThan(0);
  expect(prmJson.bearer_methods_supported).toContain("header");
  expect(prmJson.agent_auth?.skill).toMatch(/\/auth\.md$/);
  expect(prmJson.agent_auth?.register_uri).toMatch(/\/register$/);

  expect(as.ok()).toBeTruthy();
  const asJson = (await as.json()) as {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint?: string;
    jwks_uri?: string;
    agent_auth: { skill: string; register_uri: string };
  };
  expect(asJson.issuer).toBe(prmJson.authorization_servers[0]);
  expect(asJson.authorization_endpoint).toMatch(/\/login$/);
  expect(asJson.token_endpoint).toBeUndefined();
  expect(asJson.jwks_uri).toBeUndefined();
  expect(asJson.agent_auth.skill).toMatch(/\/auth\.md$/);
  expect(asJson.agent_auth.register_uri).toMatch(/\/register$/);
});

test("RFC 9727 API catalog is published", async ({ request }) => {
  const res = await request.get("/.well-known/api-catalog", {
    headers: { Accept: "application/linkset+json, application/json" },
  });
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toMatch(/application\/linkset\+json/i);
  const body = (await res.json()) as {
    linkset: Array<{
      anchor: string;
      "service-desc": Array<{ href: string }>;
      "service-doc": Array<{ href: string }>;
    }>;
  };
  expect(body.linkset.length).toBeGreaterThan(0);
  const health = body.linkset.find((entry) => entry.anchor.endsWith("/api/health"));
  expect(health).toBeTruthy();
  const spec = await request.get(new URL(health!["service-desc"][0]!.href).pathname);
  expect(spec.ok()).toBeTruthy();
});

test("homepage Link headers advertise RFC 8288 agent discovery", async ({ request }) => {
  const res = await request.get("/", { headers: { Accept: "text/html" } });
  expect(res.ok()).toBeTruthy();
  const link = res.headers()["link"] ?? "";
  expect(link).toMatch(/rel=["']?api-catalog["']?/);
  expect(link).toMatch(/rel=["']?service-desc["']?/);
  expect(link).toMatch(/rel=["']?service-doc["']?/);
  expect(link).toMatch(/rel=["']?describedby["']?/);
  expect(link).toContain("/.well-known/api-catalog");

  const [catalog, spec, docs, llms] = await Promise.all([
    request.get("/.well-known/api-catalog"),
    request.get("/openapi/health.json"),
    request.get("/docs/api"),
    request.get("/llms.txt"),
  ]);
  expect(catalog.ok()).toBeTruthy();
  expect(spec.ok()).toBeTruthy();
  expect(docs.ok()).toBeTruthy();
  expect(llms.ok()).toBeTruthy();
  expect(llms.headers()["content-type"]).toMatch(/markdown|plain/i);
});

test("Accept text/markdown returns markdown while HTML stays the default", async ({ request }) => {
  const [md, html] = await Promise.all([
    request.get("/", { headers: { Accept: "text/markdown" } }),
    request.get("/", { headers: { Accept: "text/html" } }),
  ]);

  expect(md.ok()).toBeTruthy();
  expect(md.headers()["content-type"]).toMatch(/text\/markdown/i);
  expect(md.headers()["x-markdown-tokens"]).toMatch(/^\d+$/);
  const markdown = await md.text();
  expect(markdown).toMatch(/^# /m);
  expect(markdown).not.toMatch(/<html/i);

  expect(html.ok()).toBeTruthy();
  expect(html.headers()["content-type"]).toMatch(/text\/html/i);
  expect(await html.text()).toMatch(/<html/i);
});

test("checkout is open to guests and order confirmation stays private", async ({ request }) => {
  const checkout = await request.get("/checkout");
  expect(checkout.ok(), "/checkout should render or redirect to cart for guests").toBeTruthy();
  const checkoutText = await checkout.text();
  expect(checkoutText).not.toMatch(/sign in to finish your order/i);
  expect(checkout.url()).toMatch(/\/(checkout|cart)/);

  const confirmation = await request.get("/order/TEST-ORDER/confirmation");
  expect(confirmation.ok(), "order confirmation should resolve to sign-in flow").toBeTruthy();
  expect(confirmation.url()).toContain("/login");
  expect(await confirmation.text()).toMatch(/sign in/i);
});

test("retired category slugs return 404", async ({ request }) => {
  for (const slug of ["peptides", "vitamins", "antiparasitic"]) {
    const res = await request.get(`/shop/${slug}`);
    expect(res.status(), `/shop/${slug} should be hidden`).toBe(404);
  }
});

test("legacy skin-care URL redirects to skincare", async ({ request }) => {
  const res = await request.get("/shop/skin-care");
  expect(res.ok(), "/shop/skin-care should land on the live skincare category").toBeTruthy();
  expect(new URL(res.url()).pathname).toBe("/shop/skincare");
});

test("short Modafinil landing URL redirects to the canonical page", async ({ request }) => {
  const res = await request.get("/where-to-buy-modafinil");
  expect(res.ok(), "/where-to-buy-modafinil should land on the live landing").toBeTruthy();
  expect(new URL(res.url()).pathname).toBe("/where-to-buy-modafinil-online");
});

