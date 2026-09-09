import { describe, expect, it } from "vitest";
import {
  merchantReturnPolicy,
  offerPriceValidUntil,
  offerShippingDetails,
  organizationShippingService,
} from "./merchant-listing-policy";

describe("merchant-listing-policy", () => {
  it("describes the 14-day mail-in return window", () => {
    const policy = merchantReturnPolicy("https://modempic.com");
    expect(policy.merchantReturnDays).toBe(14);
    expect(policy.returnPolicyLink).toBe("https://modempic.com/refund-policy");
    expect(policy.returnPolicyCategory).toBe("https://schema.org/MerchantReturnFiniteReturnWindow");
  });

  it("describes free express shipping on all orders", () => {
    const shipping = offerShippingDetails("https://modempic.com/");
    expect(shipping).toHaveLength(3);
    expect(shipping[0]?.shippingRate.value).toBe("0.00");
    expect(shipping[0]?.shippingRate.currency).toBe("USD");
    expect(shipping[0]?.shippingSettingsLink).toBe("https://modempic.com/shipping");
    expect(shipping[0]?.deliveryTime.transitTime).toMatchObject({ minValue: 2, maxValue: 7 });
    expect(shipping[1]?.deliveryTime.transitTime).toMatchObject({ minValue: 2, maxValue: 4 });
    expect(shipping[2]?.deliveryTime.transitTime).toMatchObject({ minValue: 5, maxValue: 11 });
    expect(shipping[2]).not.toHaveProperty("shippingDestination");
  });

  it("lists free express windows that match the shipping page", () => {
    const service = organizationShippingService();
    expect(service.shippingConditions).toHaveLength(3);
    expect(service.shippingConditions[0]?.transitTime.duration).toMatchObject({
      minValue: 2,
      maxValue: 7,
    });
    expect(service.shippingConditions[1]?.transitTime.duration).toMatchObject({
      minValue: 2,
      maxValue: 4,
    });
    expect(service.shippingConditions[2]?.transitTime.duration).toMatchObject({
      minValue: 5,
      maxValue: 11,
    });
  });

  it("sets priceValidUntil one year ahead", () => {
    expect(offerPriceValidUntil(new Date("2026-08-23T00:00:00.000Z"))).toBe("2027-08-23");
  });
});
