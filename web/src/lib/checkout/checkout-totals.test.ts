import { describe, expect, it } from "vitest";
import { previewCheckoutTotals } from "./checkout-totals";

describe("previewCheckoutTotals", () => {
  it("applies free shipping on all orders", () => {
    const totals = previewCheckoutTotals(12_000, 0);
    expect(totals.shippingCents).toBe(0);
    expect(totals.totalCents).toBe(12_000);
  });

  it("keeps shipping free when coupon grants free shipping", () => {
    const totals = previewCheckoutTotals(12_000, 0, { couponGrantsFreeShipping: true });
    expect(totals.shippingCents).toBe(0);
  });

  it("caps discount at subtotal", () => {
    const totals = previewCheckoutTotals(1000, 5000);
    expect(totals.discountCents).toBe(1000);
    expect(totals.subtotalAfterDiscountCents).toBe(0);
  });
});
