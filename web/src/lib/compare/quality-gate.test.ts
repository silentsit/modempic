import { describe, expect, it } from "vitest";
import { isCompareCandidate, isIndexableComparePair, type CompareGateProduct } from "./quality-gate";
import { buildComparePairs } from "./pairs";
import {
  canonicalComparePair,
  comparePairDisplayLabel,
  comparePath,
  isCanonicalCompareParam,
  parseComparePairParam,
} from "./compare-keys";
import { costPer200mgCents } from "./cost-per-dose";

function product(overrides: Partial<CompareGateProduct> = {}): CompareGateProduct {
  return {
    slug: "buy-modalert-200-mg",
    name: "Modalert 200 Mg",
    status: "PUBLISHED",
    manufacturer: "Sun Pharmaceutical Industries Ltd",
    activeIngredient: "Modafinil",
    strengthMg: 200,
    variants: [
      { label: "30 pills", priceCents: 4500 },
      { label: "100 pills", priceCents: 12000 },
    ],
    approvedReviewCount: 2,
    ...overrides,
  };
}

describe("compare keys", () => {
  it("canonicalizes pair order alphabetically", () => {
    expect(canonicalComparePair("buy-waklert-150-mg", "buy-modalert-200-mg").param).toBe(
      "modalert-200-mg-vs-waklert-150-mg",
    );
    expect(comparePath("buy-waklert-150-mg", "buy-modalert-200-mg")).toBe(
      "/compare/modalert-200-mg-vs-waklert-150-mg",
    );
  });

  it("rejects reversed params as non-canonical", () => {
    expect(parseComparePairParam("modalert-200-mg-vs-waklert-150-mg")).toEqual({
      left: "modalert-200-mg",
      right: "waklert-150-mg",
    });
    expect(isCanonicalCompareParam("waklert-150-mg-vs-modalert-200-mg")).toBe(false);
    expect(isCanonicalCompareParam("modalert-200-mg-vs-waklert-150-mg")).toBe(true);
    expect(comparePairDisplayLabel("modalert-200-mg-vs-waklert-150-mg")).toBe("Modalert 200 mg vs Waklert 150 mg");
  });
});

describe("quality gate", () => {
  it("rejects missing manufacturer, combos, and single-tier products", () => {
    expect(isCompareCandidate(product({ manufacturer: null })).ok).toBe(false);
    expect(isCompareCandidate(product({ slug: "starter-pack-combo", name: "Starter Pack Combo" })).ok).toBe(false);
    expect(isCompareCandidate(product({ variants: [{ label: "30 pills", priceCents: 4500 }] })).ok).toBe(false);
  });

  it("requires three combined approved reviews", () => {
    const left = product({ approvedReviewCount: 1 });
    const right = product({
      slug: "buy-vilafinil-200-mg",
      name: "Vilafinil 200 Mg",
      manufacturer: "Centurion Laboratories Private Limited",
      approvedReviewCount: 1,
    });
    expect(isIndexableComparePair(left, right).ok).toBe(false);
    expect(isIndexableComparePair({ ...left, approvedReviewCount: 2 }, right).ok).toBe(true);
  });
});

describe("pair builder", () => {
  it("builds same-molecule pairs and ranks batch one first", () => {
    const pairs = buildComparePairs([
      product({ slug: "buy-modalert-200-mg", approvedReviewCount: 8, isBestSeller: true }),
      product({
        slug: "buy-vilafinil-200-mg",
        name: "Vilafinil 200 Mg",
        manufacturer: "Centurion Laboratories Private Limited",
        approvedReviewCount: 4,
      }),
      product({
        slug: "buy-waklert-150-mg",
        name: "Waklert 150 Mg",
        manufacturer: "Sun Pharmaceutical Industries Ltd",
        activeIngredient: "Armodafinil",
        strengthMg: 150,
        approvedReviewCount: 3,
      }),
    ]);
    expect(pairs.map((pair) => pair.param)).toEqual([
      "modalert-200-mg-vs-vilafinil-200-mg",
      "modalert-200-mg-vs-waklert-150-mg",
      "vilafinil-200-mg-vs-waklert-150-mg",
    ]);
    expect(pairs.every((pair) => pair.batch === 1)).toBe(true);
  });
});

describe("cost per 200 mg", () => {
  it("normalizes a 150 mg tablet to a 200 mg-equivalent unit price", () => {
    const cents = costPer200mgCents([{ label: "30 pills", priceCents: 3000 }], 150);
    expect(cents).toBe(Math.round((3000 / 30) * (200 / 150)));
  });
});
