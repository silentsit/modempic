import { describe, expect, it } from "vitest";
import { hydrateModafinilPricingRows } from "./hydrate-modafinil-pricing";
import type { LandingPricingRow } from "@/content/landings/where-to-buy-modafinil-online";

const rows: LandingPricingRow[] = [
  {
    productSlug: "buy-modalert-200-mg",
    name: "Modalert",
    strength: "200 mg",
    packs: ["30 pills", "50 pills", "100 pills"],
  },
];

describe("hydrateModafinilPricingRows", () => {
  it("maps pack labels to live cents and 50/100 per-pill save vs 30", () => {
    const hydrated = hydrateModafinilPricingRows(rows, [
      {
        slug: "buy-modalert-200-mg",
        name: "Modalert 200 mg",
        variants: null,
        productVariants: [
          { label: "30 pills", priceCents: 4500, compareAtCents: null, sortOrder: 0, active: true },
          { label: "50 pills", priceCents: 6000, compareAtCents: null, sortOrder: 1, active: true },
          { label: "100 pills", priceCents: 10000, compareAtCents: null, sortOrder: 2, active: true },
        ],
      },
    ]);

    expect(hydrated[0]?.href).toBe("/product/buy-modalert-200-mg");
    expect(hydrated[0]?.packs.map((pack) => pack.priceCents)).toEqual([4500, 6000, 10000]);
    expect(hydrated[0]?.packs[0]?.savePercent).toBeNull();
    expect(hydrated[0]?.packs[1]?.savePercent).toBe(20);
    expect(hydrated[0]?.packs[2]?.savePercent).toBe(33);
  });

  it("leaves prices empty when the catalog row is missing", () => {
    const hydrated = hydrateModafinilPricingRows(rows, []);
    expect(hydrated[0]?.packs.every((pack) => pack.priceCents == null)).toBe(true);
  });
});
