import { describe, expect, it } from "vitest";
import { CONTENT_SIGNAL, renderRobotsTxt } from "./robots-txt";

describe("renderRobotsTxt", () => {
  const body = renderRobotsTxt("https://modempic.com/");

  it("declares search-only Content Signals under User-Agent *", () => {
    expect(CONTENT_SIGNAL).toBe("ai-train=no, search=yes, ai-input=no");
    expect(body).toMatch(/User-Agent:\s*\*\r?\nContent-Signal:\s*ai-train=no, search=yes, ai-input=no/);
  });

  it("keeps storefront crawl rules and the sitemap", () => {
    expect(body).toContain("Allow: /");
    expect(body).toContain("Disallow: /checkout");
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Sitemap: https://modempic.com/sitemap.xml");
  });
});
