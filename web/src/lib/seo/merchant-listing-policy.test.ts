import { describe, expect, it } from "vitest";
import { merchantReturnPolicy, offerPriceValidUntil, offerShippingDetails } from "./merchant-listing-policy";

describe("merchant-listing-policy", () => {
  it("describes the 14-day mail-in return window", () => {
    const policy = merchantReturnPolicy("https://modempic.com");
    expect(policy.merchantReturnDays).toBe(14);
    expect(policy.returnPolicyLink).toBe("https://modempic.com/refund-policy");
    expect(policy.returnPolicyCategory).toBe("https://schema.org/MerchantReturnFiniteReturnWindow");
  });

  it("describes free express shipping on all orders", () => {
    const shipping = offerShippingDetails("https://modempic.com/");
    expect(shipping.shippingRate.value).toBe("0.00");
    expect(shipping.shippingRate.currency).toBe("USD");
    expect(shipping.shippingSettingsLink).toBe("https://modempic.com/shipping");
    expect(shipping.deliveryTime.transitTime.minValue).toBe(7);
    expect(shipping.deliveryTime.transitTime.maxValue).toBe(14);
  });

  it("sets priceValidUntil one year ahead", () => {
    expect(offerPriceValidUntil(new Date("2026-08-23T00:00:00.000Z"))).toBe("2027-08-23");
  });
});
