import { describe, expect, it } from "vitest";
import { renderLlmsTxt } from "./llms-txt";

describe("renderLlmsTxt", () => {
  it("describes the storefront and points at the API catalog", () => {
    const body = renderLlmsTxt("https://modempic.com");
    expect(body.startsWith("# Modempic\n")).toBe(true);
    expect(body).toContain("https://modempic.com/.well-known/api-catalog");
    expect(body).toContain("https://modempic.com/.well-known/oauth-protected-resource");
    expect(body).not.toContain("openid-configuration");
    expect(body).toContain("https://modempic.com/shop");
    expect(body).toMatch(/not medical advice/i);
  });

  it("lists categories, compare pages, shipping destinations, and guides", () => {
    const body = renderLlmsTxt("https://modempic.com");
    expect(body).toContain("https://modempic.com/shop/nootropics");
    expect(body).toContain("https://modempic.com/modafinil-price-comparison");
    expect(body).toContain("https://modempic.com/modafinil-price-comparison.csv");
    expect(body).toContain("https://modempic.com/where-to-buy-modafinil-online");
    expect(body).toContain("https://modempic.com/buy-modafinil-reddit");
    expect(body).toContain("https://modempic.com/compare/modalert-200-mg-vs-waklert-150-mg");
    expect(body).toContain("https://modempic.com/shipping/united-states");
    expect(body).toContain("https://modempic.com/blog");
    expect(body).toContain("https://modempic.com/about");
  });

  it("includes featured product links when provided", () => {
    const body = renderLlmsTxt("https://modempic.com", {
      featuredProducts: [{ slug: "buy-modalert-200-mg", name: "Modalert 200 mg" }],
    });
    expect(body).toContain("https://modempic.com/product/buy-modalert-200-mg");
    expect(body).toContain("Modalert 200 mg");
  });
});
