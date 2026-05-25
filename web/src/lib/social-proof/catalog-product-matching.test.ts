import { describe, expect, it } from "vitest";
import { publishedProductMatches } from "./catalog-product-matching";

const CATALOG = [
  { slug: "sleep-support", name: "Sleep Support Caps" },
  { slug: "glp-1-booster", name: "GLP-1 Booster" },
] as const;

describe("publishedProductMatches", () => {
  it("matches by slug", () => {
    expect(
      publishedProductMatches(CATALOG, {
        productSlug: "sleep-support",
        productHint: "Not real",
      }),
    ).toBe(true);
  });

  it("matches by exact product name", () => {
    expect(publishedProductMatches(CATALOG, { productHint: "GLP-1 Booster" })).toBe(true);
  });

  it("matches truncated hints", () => {
    const longName = "A".repeat(60);
    const catalog = [{ slug: "long-item", name: longName }];
    const hint = `${longName.slice(0, 47)}…`;
    expect(publishedProductMatches(catalog, { productHint: hint })).toBe(true);
  });

  it("rejects unknown products", () => {
    expect(publishedProductMatches(CATALOG, { productHint: "Random Amazon Item" })).toBe(false);
    expect(publishedProductMatches(CATALOG, { productSlug: "missing-slug" })).toBe(false);
  });

  it("allows items without product copy", () => {
    expect(publishedProductMatches(CATALOG, {})).toBe(true);
  });
});
