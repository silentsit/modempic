import { describe, it, expect } from "vitest";
import {
  evaluateCouponForCart,
  parseAllowedEmails,
  type CartLineForCoupon,
  type CouponWithRules,
} from "./coupon-eval";

const ctx = { userId: "u1", userEmail: "buyer@example.com", userRedemptionCount: 0 };

function baseCoupon(overrides: Partial<CouponWithRules> = {}): CouponWithRules {
  return {
    id: "c1",
    code: "SAVE10",
    description: null,
    type: "PERCENT",
    value: 10,
    minOrderCents: 0,
    maxOrderCents: null,
    maxRedemptions: null,
    usageLimitPerUser: null,
    redemptionCount: 0,
    startsAt: null,
    endsAt: null,
    active: true,
    freeShipping: false,
    excludeSaleItems: false,
    allowedEmails: null,
    createdAt: new Date(),
    productIncludes: [],
    productExcludes: [],
    categoryIncludes: [],
    categoryExcludes: [],
    ...overrides,
  };
}

const line: CartLineForCoupon = {
  productId: "p1",
  lineTotalCents: 10_000,
  categoryIds: ["cat1"],
  compareAtCents: null,
  unitPriceCents: 10_000,
};

describe("parseAllowedEmails", () => {
  it("returns null when empty", () => {
    expect(parseAllowedEmails(null)).toBeNull();
    expect(parseAllowedEmails("  ")).toBeNull();
  });

  it("splits on comma or semicolon", () => {
    expect(parseAllowedEmails("A@x.com; B@x.com")).toEqual(["a@x.com", "b@x.com"]);
  });
});

describe("evaluateCouponForCart", () => {
  it("applies percent discount to eligible lines", () => {
    const r = evaluateCouponForCart(baseCoupon(), "save10", [line], 10_000, ctx);
    expect(r.couponId).toBe("c1");
    expect(r.discountCents).toBe(1000);
    expect(r.appliedCode).toBe("SAVE10");
  });

  it("rejects unknown code", () => {
    const r = evaluateCouponForCart(null, "nope", [line], 10_000, ctx);
    expect(r.couponId).toBeUndefined();
    expect(r.message).toMatch(/not found/i);
  });

  it("excludes products in exclude list", () => {
    const coupon = baseCoupon({
      productExcludes: [{ couponId: "c1", productId: "p1" }],
    });
    const r = evaluateCouponForCart(coupon, "SAVE10", [line], 10_000, ctx);
    expect(r.couponId).toBeUndefined();
    expect(r.message).toMatch(/does not qualify/i);
  });

  it("requires category include when configured", () => {
    const coupon = baseCoupon({
      categoryIncludes: [{ couponId: "c1", categoryId: "other" }],
    });
    const r = evaluateCouponForCart(coupon, "SAVE10", [line], 10_000, ctx);
    expect(r.couponId).toBeUndefined();
  });

  it("allows free-shipping-only with zero discount", () => {
    const coupon = baseCoupon({ value: 0, freeShipping: true, type: "FIXED" });
    const r = evaluateCouponForCart(coupon, "FREESHIP", [line], 10_000, ctx);
    expect(r.couponId).toBe("c1");
    expect(r.discountCents).toBe(0);
    expect(r.freeShipping).toBe(true);
  });

  it("enforces allowed emails", () => {
    const coupon = baseCoupon({ allowedEmails: "other@example.com" });
    const r = evaluateCouponForCart(coupon, "SAVE10", [line], 10_000, ctx);
    expect(r.couponId).toBeUndefined();
    expect(r.message).toMatch(/not available/i);
  });
});
