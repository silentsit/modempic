import { describe, expect, it } from "vitest";
import { previewCheckoutTotals } from "./checkout-totals";
import { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/domain/checkout-pricing";

describe("previewCheckoutTotals", () => {
  it("applies flat shipping below the free-shipping threshold", () => {
    const totals = previewCheckoutTotals(FREE_SHIPPING_THRESHOLD_CENTS - 100, 0);
    expect(totals.shippingCents).toBe(FLAT_SHIPPING_CENTS);
    expect(totals.totalCents).toBe(FREE_SHIPPING_THRESHOLD_CENTS - 100 + FLAT_SHIPPING_CENTS);
  });

  it("waives shipping when coupon grants free shipping", () => {
    const subtotal = FREE_SHIPPING_THRESHOLD_CENTS - 100;
    const totals = previewCheckoutTotals(subtotal, 0, { couponGrantsFreeShipping: true });
    expect(totals.shippingCents).toBe(0);
  });

  it("caps discount at subtotal", () => {
    const totals = previewCheckoutTotals(1000, 5000);
    expect(totals.discountCents).toBe(1000);
    expect(totals.subtotalAfterDiscountCents).toBe(0);
  });
});
