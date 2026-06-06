import { describe, expect, it } from "vitest";
import {
  filterVisibleCategorySlugs,
  isStorefrontCategoryVisible,
  productHasVisibleCategory,
} from "./category-visibility";

describe("category-visibility", () => {
  it("shows modafinil and hides retired categories", () => {
    expect(isStorefrontCategoryVisible("modafinil")).toBe(true);
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
        { slug: "antiparasitic" },
        { slug: "modafinil" },
      ]),
    ).toEqual([{ slug: "modafinil" }]);
  });

  it("treats peptide-only products as not storefront-visible", () => {
    expect(productHasVisibleCategory([{ category: { slug: "peptides" } }])).toBe(false);
    expect(
      productHasVisibleCategory([{ category: { slug: "peptides" } }, { category: { slug: "modafinil" } }]),
    ).toBe(true);
  });
});
