import { describe, expect, it } from "vitest";
import { buildCollectionPageJsonLd } from "./listing-json-ld";

describe("listing JSON-LD", () => {
  it("wraps catalog items in a CollectionPage", () => {
    const page = buildCollectionPageJsonLd({
      name: "Shop",
      description: "Browse the catalog.",
      path: "/shop",
      items: [{ name: "Modalert 200 mg", url: "/product/buy-modalert-200-mg" }],
      baseUrl: "https://modempic.com",
    });
    expect(page["@type"]).toBe("CollectionPage");
    expect(page.mainEntity.numberOfItems).toBe(1);
    expect(page.mainEntity.itemListElement[0]?.url).toBe(
      "https://modempic.com/product/buy-modalert-200-mg",
    );
    expect(page.isPartOf).toEqual({ "@id": "https://modempic.com/#website" });
  });
});
