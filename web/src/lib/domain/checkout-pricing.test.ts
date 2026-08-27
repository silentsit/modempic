import { describe, expect, it } from "vitest";
import {
  checkoutShippingMethodLabel,
  checkoutTaxCents,
  computeShippingCents,
} from "./checkout-pricing";

describe("computeShippingCents", () => {
  it("returns free shipping for all order subtotals", () => {
    expect(computeShippingCents(0)).toBe(0);
    expect(computeShippingCents(50_00)).toBe(0);
    expect(computeShippingCents(500_00)).toBe(0);
  });
});

describe("checkoutShippingMethodLabel", () => {
  it("labels free and paid shipping consistently", () => {
    expect(checkoutShippingMethodLabel(0)).toBe("Free Shipping");
    expect(checkoutShippingMethodLabel(20_00)).toBe("Express Shipping");
  });
});

describe("checkoutTaxCents", () => {
  it("currently returns zero tax for checkout orders", () => {
    expect(checkoutTaxCents(0)).toBe(0);
    expect(checkoutTaxCents(12_345)).toBe(0);
  });
});
