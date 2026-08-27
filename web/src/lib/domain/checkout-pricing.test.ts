import { describe, expect, it } from "vitest";
import {
  checkoutShippingMethodLabel,
  checkoutTaxCents,
  computeShippingCents,
  FLAT_SHIPPING_CENTS,
  FREE_SHIPPING_QUALIFY_AT_CENTS,
  FREE_SHIPPING_THRESHOLD_CENTS,
  getFreeShippingProgress,
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

describe("getFreeShippingProgress", () => {
  it("reports amount still needed below the threshold", () => {
    const progress = getFreeShippingProgress(120_00);
    expect(progress.qualifies).toBe(false);
    expect(progress.needCents).toBe(80_01);
    expect(progress.progressPct).toBeCloseTo(59.999, 2);
  });

  it("reports qualified once subtotal exceeds the threshold", () => {
    const progress = getFreeShippingProgress(FREE_SHIPPING_QUALIFY_AT_CENTS);
    expect(progress.qualifies).toBe(true);
    expect(progress.needCents).toBe(0);
    expect(progress.progressPct).toBe(100);
  });
});
