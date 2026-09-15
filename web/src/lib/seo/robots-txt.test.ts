import { describe, expect, it } from "vitest";
import { CONTENT_SIGNAL, renderRobotsTxt } from "./robots-txt";

describe("renderRobotsTxt", () => {
  const body = renderRobotsTxt("https://modempic.com/");

  it("declares Content Signals under User-Agent *", () => {
    expect(CONTENT_SIGNAL).toBe("ai-train=no, search=yes, ai-input=yes");
    expect(body).toMatch(/User-Agent:\s*\*\r?\nContent-Signal:\s*ai-train=no, search=yes, ai-input=yes/);
  });

  it("keeps storefront crawl rules, the sitemap, and an llms.txt pointer", () => {
    expect(body).toContain("Allow: /");
    expect(body).toContain("Disallow: /checkout");
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Sitemap: https://modempic.com/sitemap.xml");
    expect(body).toContain("# Agent summary: https://modempic.com/llms.txt");
  });
});
