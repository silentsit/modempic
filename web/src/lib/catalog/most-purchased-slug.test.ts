import { describe, expect, it } from "vitest";
import { pickMostPurchasedSlug } from "@/lib/catalog/most-purchased-slug";

describe("pickMostPurchasedSlug", () => {
  it("returns null when no eligible purchases exist", () => {
    expect(pickMostPurchasedSlug([])).toBe(null);
    expect(pickMostPurchasedSlug([{ slug: "buy-modalert-200-mg", quantity: 5, visible: false }])).toBe(null);
  });

  it("picks the slug with the highest quantity", () => {
    expect(
      pickMostPurchasedSlug([
        { slug: "buy-modalert-200-mg", quantity: 12, visible: true },
        { slug: "buy-waklert-150-mg", quantity: 20, visible: true },
      ]),
    ).toBe("buy-waklert-150-mg");
  });

  it("breaks quantity ties by slug for stable ordering", () => {
    expect(
      pickMostPurchasedSlug([
        { slug: "buy-waklert-150-mg", quantity: 10, visible: true },
        { slug: "buy-modalert-200-mg", quantity: 10, visible: true },
      ]),
    ).toBe("buy-modalert-200-mg");
  });
});
