import { describe, expect, it } from "vitest";
import {
  skuForVariant,
  tiersFromProduct,
  variantKeyForTierIndex,
} from "@/lib/catalog/product-variant-store";

describe("product-variant-store", () => {
  it("maps tier indices to legacy variant keys", () => {
    expect(variantKeyForTierIndex(1, 0)).toBe("");
    expect(variantKeyForTierIndex(3, 1)).toBe("t1");
  });

  it("builds stable SKUs from slug and variant key", () => {
    expect(skuForVariant("modafinil-100", "")).toBe("modafinil-100");
    expect(skuForVariant("modafinil-100", "t1")).toBe("modafinil-100-t1");
  });

  it("prefers relational variants over legacy JSON", () => {
    const tiers = tiersFromProduct({
      priceCents: 1000,
      variants: [{ label: "Legacy", priceCents: 1000 }],
      productVariants: [
        {
          id: "v1",
          productId: "p1",
          variantKey: "",
          sku: "relational",
          label: "Relational",
          priceCents: 2500,
          compareAtCents: null,
          sortOrder: 0,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      name: "Test",
    });
    expect(tiers).toEqual([{ label: "Relational", priceCents: 2500 }]);
  });
});
