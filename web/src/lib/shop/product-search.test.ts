import { describe, expect, it } from "vitest";
import { normalizeShopQuery, productMatchesQuery } from "./product-search";

describe("shop product search", () => {
  it("normalizes whitespace and caps length", () => {
    expect(normalizeShopQuery("  moda   finil  ")).toBe("moda finil");
    expect(normalizeShopQuery("x".repeat(100))).toHaveLength(80);
  });

  it("matches name, short copy, and category", () => {
    const product = {
      name: "Modalert 200 mg",
      shortDesc: "Wakefulness support",
      longDesc: "Imported long description mentioning orexin.",
      categories: [{ category: { name: "Nootropics" } }],
    };
    expect(productMatchesQuery(product, "modalert")).toBe(true);
    expect(productMatchesQuery(product, "nootropics")).toBe(true);
    expect(productMatchesQuery(product, "orexin")).toBe(true);
    expect(productMatchesQuery(product, "gabapentin")).toBe(false);
  });
});
