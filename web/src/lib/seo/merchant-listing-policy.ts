/** Destinations listed on /shipping for the 2–7 business-day window. */
export const MAJOR_SHIP_COUNTRIES = ["US", "CA", "GB", "AU"] as const;

/** South-East Asia destinations listed on /shipping for the 2–4 business-day window. */
export const SEA_SHIP_COUNTRIES = ["VN", "SG", "ID", "PH", "BN", "MM", "LA", "KH", "MY"] as const;

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

/** Express shipping is free on all orders. */
export function offerShippingDetails(siteOrigin: string) {
  const root = siteOrigin.replace(/\/$/, "");
  return {
    "@type": "OfferShippingDetails" as const,
    shippingRate: {
      "@type": "MonetaryAmount" as const,
      value: "0.00",
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
        minValue: 2,
        maxValue: 7,
        unitCode: "DAY",
      },
    },
    shippingSettingsLink: `${root}/shipping`,
  };
}

function shippingCondition({
  countries,
  transitMin,
  transitMax,
}: {
  countries: readonly string[];
  transitMin: number;
  transitMax: number;
}) {
  return {
    "@type": "ShippingConditions" as const,
    shippingRate: {
      "@type": "MonetaryAmount" as const,
      value: 0,
      currency: "USD",
    },
    shippingDestination: countries.map((addressCountry) => ({
      "@type": "DefinedRegion" as const,
      addressCountry,
    })),
    handlingTime: {
      "@type": "ServicePeriod" as const,
      duration: {
        "@type": "QuantitativeValue" as const,
        minValue: 0,
        maxValue: 1,
        unitCode: "DAY",
      },
    },
    transitTime: {
      "@type": "ServicePeriod" as const,
      duration: {
        "@type": "QuantitativeValue" as const,
        minValue: transitMin,
        maxValue: transitMax,
        unitCode: "DAY",
      },
    },
  };
}

/** Organization-level shipping policy — must match the visible /shipping windows. */
export function organizationShippingService() {
  return {
    "@type": "ShippingService" as const,
    name: "Free worldwide express",
    description: "100% free shipping on every order — worldwide express mail.",
    shippingConditions: [
      shippingCondition({ countries: MAJOR_SHIP_COUNTRIES, transitMin: 2, transitMax: 7 }),
      shippingCondition({ countries: SEA_SHIP_COUNTRIES, transitMin: 2, transitMax: 4 }),
    ],
  };
}

export function offerPriceValidUntil(now = new Date()) {
  const expires = new Date(now);
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  return expires.toISOString().slice(0, 10);
}
