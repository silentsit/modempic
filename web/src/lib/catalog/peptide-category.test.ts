import { describe, expect, it } from "vitest";
import {
  filterVisibleCategorySlugs,
  isPeptidesCategoryVisible,
  PEPTIDES_CATEGORY_LAUNCHED,
  productHasVisibleCategory,
  productInPeptidesCategory,
} from "./peptide-category";

describe("peptide-category", () => {
  it("detects peptide category membership", () => {
    expect(productInPeptidesCategory([{ category: { slug: "modafinil" } }])).toBe(false);
    expect(productInPeptidesCategory([{ category: { slug: "peptides" } }])).toBe(true);
  });

  it("hides peptides slug from storefront when not launched", () => {
    if (PEPTIDES_CATEGORY_LAUNCHED) return;
    expect(isPeptidesCategoryVisible("peptides")).toBe(false);
    expect(isPeptidesCategoryVisible("modafinil")).toBe(true);
    expect(isPeptidesCategoryVisible("vitamins")).toBe(false);
    expect(isPeptidesCategoryVisible("cancer")).toBe(false);
    expect(
      filterVisibleCategorySlugs([
        { slug: "peptides" },
        { slug: "vitamins" },
        { slug: "cancer" },
        { slug: "modafinil" },
      ]),
    ).toEqual([{ slug: "modafinil" }]);
    expect(productHasVisibleCategory([{ category: { slug: "peptides" } }])).toBe(false);
    expect(productHasVisibleCategory([{ category: { slug: "peptides" } }, { category: { slug: "modafinil" } }])).toBe(true);
  });
});
