import { describe, expect, it } from "vitest";
import {
  formatProductPriceDisplay,
  formatTierPriceLine,
  productHeadlineCompareStrikeCents,
  tierLabelBaseOnly,
} from "./product-variants";

describe("tierLabelBaseOnly", () => {
  it("strips appended pricing lines from imports", () => {
    expect(tierLabelBaseOnly("30 pills — $45 — ($1.50 each)")).toBe("30 pills");
  });

  it("keeps plain pack labels", () => {
    expect(tierLabelBaseOnly("300 pills")).toBe("300 pills");
  });
});

describe("formatTierPriceLine", () => {
  it("does not duplicate when label already embeds prices", () => {
    const line = formatTierPriceLine({
      label: "30 pills — $45 — ($1.50 each)",
      priceCents: 4500,
    });
    expect(line).toBe(`30 pills \u2014 $45 \u2014 ($1.50 each)`);
    expect((line.match(/\$45/g) ?? []).length).toBe(1);
  });
});

describe("formatProductPriceDisplay", () => {
  it("uses tier price when exactly one variant tier exists", () => {
    expect(
      formatProductPriceDisplay({
        priceCents: 999,
        compareAtCents: null,
        variants: [{ label: "30 pills", priceCents: 4500 }],
      }),
    ).toMatch(/\$45/);
  });

  it("uses product.priceCents when no tiers", () => {
    expect(
      formatProductPriceDisplay({
        priceCents: 2499,
        compareAtCents: null,
        variants: null,
      }),
    ).toMatch(/\$24\.99/);
  });
});

describe("productHeadlineCompareStrikeCents", () => {
  it("reads tier compare-at for single tier", () => {
    expect(
      productHeadlineCompareStrikeCents({
        priceCents: 999,
        compareAtCents: null,
        variants: [{ label: "30 pills", priceCents: 4500, compareAtCents: 5000 }],
      }),
    ).toBe(5000);
  });
});
