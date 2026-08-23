import { describe, expect, it } from "vitest";
import {
  filterVisibleCategorySlugs,
  isStorefrontCategoryVisible,
  productHasVisibleCategory,
} from "./category-visibility";

describe("category-visibility", () => {
  it("shows the four storefront categories and hides retired or legacy slugs", () => {
    expect(isStorefrontCategoryVisible("nootropics")).toBe(true);
    expect(isStorefrontCategoryVisible("anti-epileptic")).toBe(true);
    expect(isStorefrontCategoryVisible("skincare")).toBe(true);
    expect(isStorefrontCategoryVisible("sexual-health")).toBe(true);
    expect(isStorefrontCategoryVisible("modafinil")).toBe(false);
    expect(isStorefrontCategoryVisible("peptides")).toBe(false);
    expect(isStorefrontCategoryVisible("vitamins")).toBe(false);
    expect(isStorefrontCategoryVisible("skin-care")).toBe(false);
    expect(isStorefrontCategoryVisible("antiparasitic")).toBe(false);
  });

  it("filters hidden slugs from storefront category lists", () => {
    expect(
      filterVisibleCategorySlugs([
        { slug: "peptides" },
        { slug: "vitamins" },
        { slug: "skin-care" },
        { slug: "modafinil" },
        { slug: "nootropics" },
      ]),
    ).toEqual([{ slug: "nootropics" }]);
  });

  it("treats peptide-only products as not storefront-visible", () => {
    expect(productHasVisibleCategory([{ category: { slug: "peptides" } }])).toBe(false);
    expect(
      productHasVisibleCategory([{ category: { slug: "peptides" } }, { category: { slug: "nootropics" } }]),
    ).toBe(true);
  });

  it("keeps Modafinil-tagged products visible until they are remapped", () => {
    expect(productHasVisibleCategory([{ category: { slug: "modafinil" } }])).toBe(true);
  });
});
