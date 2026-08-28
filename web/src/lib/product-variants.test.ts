import { describe, expect, it } from "vitest";
import {
  defaultPackTierIndex,
  formatProductPriceDisplay,
  formatTierPriceLine,
  lowestPricePerPillCents,
  productHeadlineCompareStrikeCents,
  productShowsStorefrontSaleBadge,
  resolveStorefrontCornerBadge,
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

describe("defaultPackTierIndex", () => {
  it("selects the 100-count pack when present", () => {
    expect(
      defaultPackTierIndex([
        { label: "30 pills", priceCents: 5000 },
        { label: "50 pills", priceCents: 7000 },
        { label: "100 pills", priceCents: 12000 },
      ]),
    ).toBe(2);
  });

  it("falls back to the last pack when there is no 100-count tier", () => {
    expect(
      defaultPackTierIndex([
        { label: "10 pills of each", priceCents: 3900 },
        { label: "30 pills of each", priceCents: 6900 },
      ]),
    ).toBe(1);
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

describe("lowestPricePerPillCents", () => {
  it("picks the cheapest per-pill pack", () => {
    expect(
      lowestPricePerPillCents([
        { label: "30 pills", priceCents: 4500 },
        { label: "90 pills", priceCents: 9000 },
      ]),
    ).toBe(100);
  });

  it("ignores non-pill tiers", () => {
    expect(lowestPricePerPillCents([{ label: "Standard", priceCents: 3500 }])).toBe(null);
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

describe("productShowsStorefrontSaleBadge", () => {
  const onSale = {
    priceCents: 4500,
    compareAtCents: 5000,
    variants: null,
  };

  it("shows badge for whitelisted modafinil brands with sale pricing", () => {
    expect(productShowsStorefrontSaleBadge({ slug: "buy-modalert-200-mg", ...onSale })).toBe(true);
    expect(productShowsStorefrontSaleBadge({ slug: "buy-artvigil-150-mg", ...onSale })).toBe(true);
    expect(productShowsStorefrontSaleBadge({ slug: "buy-waklert-150-mg", ...onSale })).toBe(true);
    expect(productShowsStorefrontSaleBadge({ slug: "buy-vilafinil-200-mg", ...onSale })).toBe(true);
    expect(productShowsStorefrontSaleBadge({ slug: "buy-armodaxl-250-mg", ...onSale })).toBe(true);
  });

  it("hides badge for other modafinil products even when on sale", () => {
    expect(productShowsStorefrontSaleBadge({ slug: "buy-modvigil-200-mg", ...onSale })).toBe(false);
    expect(productShowsStorefrontSaleBadge({ slug: "buy-modawake-200-mg", ...onSale })).toBe(false);
    expect(productShowsStorefrontSaleBadge({ slug: "buy-modaxl-300-mg", ...onSale })).toBe(false);
  });

  it("hides badge when product is not on sale", () => {
    expect(
      productShowsStorefrontSaleBadge({
        slug: "buy-modalert-200-mg",
        priceCents: 4500,
        compareAtCents: null,
        variants: null,
      }),
    ).toBe(false);
  });
});

describe("resolveStorefrontCornerBadge", () => {
  const onSale = {
    priceCents: 4500,
    compareAtCents: 5000,
    variants: null,
  };

  it("prefers best seller over sale for the top-purchased slug", () => {
    expect(
      resolveStorefrontCornerBadge({ slug: "buy-modalert-200-mg", ...onSale }, "buy-modalert-200-mg"),
    ).toBe("best-seller");
  });

  it("shows sale when product is eligible and not the top seller", () => {
    expect(resolveStorefrontCornerBadge({ slug: "buy-modalert-200-mg", ...onSale }, "buy-waklert-150-mg")).toBe(
      "sale",
    );
  });

  it("returns null when no badge applies", () => {
    expect(resolveStorefrontCornerBadge({ slug: "buy-modvigil-200-mg", ...onSale }, null)).toBe(null);
  });
});
