import { describe, expect, it } from "vitest";
import {
  isLegacyMappedCategorySlug,
  isStorefrontCategorySlug,
  productCategorySlugsForQuery,
  sortStorefrontCategories,
  STOREFRONT_CATEGORIES,
} from "./storefront-categories";

describe("storefront-categories", () => {
  it("defines the four storefront categories in nav order", () => {
    expect(STOREFRONT_CATEGORIES.map((category) => category.slug)).toEqual([
      "nootropics",
      "anti-epileptic",
      "skincare",
      "sexual-health",
    ]);
  });

  it("maps Modafinil products into Nootropics", () => {
    expect(productCategorySlugsForQuery("nootropics")).toEqual(["nootropics", "modafinil"]);
    expect(isLegacyMappedCategorySlug("modafinil")).toBe(true);
    expect(isStorefrontCategorySlug("modafinil")).toBe(false);
  });

  it("sorts categories in nav order", () => {
    expect(
      sortStorefrontCategories([{ slug: "skincare" }, { slug: "nootropics" }, { slug: "sexual-health" }]).map(
        (category) => category.slug,
      ),
    ).toEqual(["nootropics", "skincare", "sexual-health"]);
  });
});
