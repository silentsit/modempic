import { describe, expect, it } from "vitest";
import { comparePath } from "./compare-keys";
import {
  PUBLIC_COMPARE_PAIRS,
  PUBLIC_COMPARE_PATHS,
  RETIRED_COMPARE_PATHS,
  isPublicComparePath,
  publicComparePairByParam,
  selectPublicComparePairs,
} from "./public-pairs";

describe("public compare pairs", () => {
  it("keeps four canonical hero paths and does not overlap retired URLs", () => {
    expect(PUBLIC_COMPARE_PATHS).toHaveLength(4);
    expect(new Set(PUBLIC_COMPARE_PATHS).size).toBe(4);
    expect(PUBLIC_COMPARE_PATHS.every((path) => isPublicComparePath(path))).toBe(true);
    for (const path of RETIRED_COMPARE_PATHS) {
      expect(isPublicComparePath(path)).toBe(false);
    }
  });

  it("matches comparePath() for each public pair", () => {
    expect(PUBLIC_COMPARE_PATHS).toEqual(
      PUBLIC_COMPARE_PAIRS.map(([left, right]) => comparePath(left, right)),
    );
  });

  it("drops non-public pairs from a mixed list", () => {
    const selected = selectPublicComparePairs([
      { path: "/compare/modalert-200-mg-vs-waklert-150-mg" },
      { path: "/compare/artvigil-250-mg-vs-modalert-200-mg" },
    ]);
    expect(selected).toEqual([{ path: "/compare/modalert-200-mg-vs-waklert-150-mg" }]);
  });

  it("builds a hero pair record without the quality gate", () => {
    expect(publicComparePairByParam("modalert-200-mg-vs-waklert-150-mg")).toEqual({
      leftSlug: "buy-modalert-200-mg",
      rightSlug: "buy-waklert-150-mg",
      param: "modalert-200-mg-vs-waklert-150-mg",
      path: "/compare/modalert-200-mg-vs-waklert-150-mg",
      batch: 1,
    });
    expect(publicComparePairByParam("artvigil-250-mg-vs-modalert-200-mg")).toBeNull();
  });
});
