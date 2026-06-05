import { describe, expect, it } from "vitest";
import {
  checkoutShippingMethodLabel,
  checkoutTaxCents,
  computeShippingCents,
  FLAT_SHIPPING_CENTS,
  FREE_SHIPPING_QUALIFY_AT_CENTS,
  FREE_SHIPPING_THRESHOLD_CENTS,
} from "./checkout-pricing";

describe("computeShippingCents", () => {
  it("charges flat shipping below the free shipping threshold", () => {
    expect(computeShippingCents(FREE_SHIPPING_THRESHOLD_CENTS - 1)).toBe(FLAT_SHIPPING_CENTS);
  });

  it("charges flat shipping at exactly the free shipping threshold", () => {
    expect(computeShippingCents(FREE_SHIPPING_THRESHOLD_CENTS)).toBe(FLAT_SHIPPING_CENTS);
  });

  it("returns free shipping only above the threshold", () => {
    expect(computeShippingCents(FREE_SHIPPING_QUALIFY_AT_CENTS)).toBe(0);
  });
});

describe("checkoutShippingMethodLabel", () => {
  it("labels paid and free shipping consistently", () => {
    expect(checkoutShippingMethodLabel(FLAT_SHIPPING_CENTS)).toBe("Express Shipping");
    expect(checkoutShippingMethodLabel(0)).toBe("Free Shipping");
  });
});

describe("checkoutTaxCents", () => {
  it("currently returns zero tax for checkout orders", () => {
    expect(checkoutTaxCents(0)).toBe(0);
    expect(checkoutTaxCents(12_345)).toBe(0);
  });
});
