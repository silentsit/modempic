import { describe, expect, it } from "vitest";
import {
  defaultCartVariantForListings,
  resolveCartVariantFromTierIndex,
  tierLabelForVariantKey,
} from "./cart-price";

describe("resolveCartVariantFromTierIndex", () => {
  const base = { priceCents: 999, variants: null };

  it("uses product.priceCents when no tiers", () => {
    const r = resolveCartVariantFromTierIndex(base, null);
    expect(r).toEqual({ unitPriceCents: 999, variantKey: "" });
  });

  it("rejects tier index when no tiers", () => {
    const r = resolveCartVariantFromTierIndex(base, "0");
    expect(r).toEqual({ error: "CART_REJECTED" });
  });

  it("single tier ignores arbitrary index except 0", () => {
    const one = { priceCents: 100, variants: [{ label: "60 pills", priceCents: 4500 }] };
    expect(resolveCartVariantFromTierIndex(one, null)).toEqual({ unitPriceCents: 4500, variantKey: "" });
    expect(resolveCartVariantFromTierIndex(one, "0")).toEqual({ unitPriceCents: 4500, variantKey: "" });
    expect(resolveCartVariantFromTierIndex(one, "1")).toEqual({ error: "CART_REJECTED" });
  });

  it("multi-tier requires valid index", () => {
    const multi = {
      priceCents: 100,
      variants: [
        { label: "30 pills", priceCents: 4500 },
        { label: "60 pills", priceCents: 8000 },
      ],
    };
    expect(resolveCartVariantFromTierIndex(multi, null)).toEqual({ error: "CART_REJECTED" });
    expect(resolveCartVariantFromTierIndex(multi, "0")).toEqual({ unitPriceCents: 4500, variantKey: "t0" });
    expect(resolveCartVariantFromTierIndex(multi, "1")).toEqual({ unitPriceCents: 8000, variantKey: "t1" });
    expect(resolveCartVariantFromTierIndex(multi, "9")).toEqual({ error: "CART_REJECTED" });
  });
});

describe("defaultCartVariantForListings", () => {
  it("picks cheapest tier when multiple", () => {
    const r = defaultCartVariantForListings({
      priceCents: 9999,
      variants: [
        { label: "60 pills", priceCents: 8000 },
        { label: "30 pills", priceCents: 4500 },
      ],
    });
    expect(r).toEqual({ unitPriceCents: 4500, variantKey: "t1" });
  });
});

describe("tierLabelForVariantKey", () => {
  it("returns label for tier keys", () => {
    const label = tierLabelForVariantKey(
      { variants: [{ label: "30 pills", priceCents: 1 }] },
      "t0",
    );
    expect(label).toBe("30 pills");
  });
});
