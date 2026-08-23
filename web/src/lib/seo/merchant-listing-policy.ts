import { FLAT_SHIPPING_CENTS } from "@/lib/domain/checkout-pricing";

const MAJOR_SHIP_COUNTRIES = ["US", "CA", "GB", "AU"] as const;

export function merchantReturnPolicy(siteOrigin: string) {
  const root = siteOrigin.replace(/\/$/, "");
  return {
    "@type": "MerchantReturnPolicy" as const,
    applicableCountry: [...MAJOR_SHIP_COUNTRIES],
    returnPolicyCountry: "US",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnShippingFees",
    refundType: "https://schema.org/FullRefund",
    returnPolicyLink: `${root}/refund-policy`,
  };
}

/** Base express rate for a single item under the free-shipping threshold. */
export function offerShippingDetails(siteOrigin: string) {
  const root = siteOrigin.replace(/\/$/, "");
  return {
    "@type": "OfferShippingDetails" as const,
    shippingRate: {
      "@type": "MonetaryAmount" as const,
      value: (FLAT_SHIPPING_CENTS / 100).toFixed(2),
      currency: "USD",
    },
    shippingDestination: MAJOR_SHIP_COUNTRIES.map((addressCountry) => ({
      "@type": "DefinedRegion" as const,
      addressCountry,
    })),
    deliveryTime: {
      "@type": "ShippingDeliveryTime" as const,
      handlingTime: {
        "@type": "QuantitativeValue" as const,
        minValue: 0,
        maxValue: 1,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue" as const,
        minValue: 7,
        maxValue: 14,
        unitCode: "DAY",
      },
    },
    shippingSettingsLink: `${root}/shipping`,
  };
}

export function offerPriceValidUntil(now = new Date()) {
  const expires = new Date(now);
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  return expires.toISOString().slice(0, 10);
}
