import { merchantReturnPolicy, organizationShippingService } from "@/lib/seo/merchant-listing-policy";
import { ORGANIZATION_SUPPORT_EMAIL, organizationLogo, siteGraphIds } from "@/lib/seo/page-json-ld";

export const ORGANIZATION_DESCRIPTION =
  "Hard-to-find medicines at guaranteed best prices. Clear labels, pack-size pricing, and secure card or crypto checkout.";

const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/modempic";

export function buildOrganizationJsonLd(baseUrl: string) {
  const { root, organizationId } = siteGraphIds(baseUrl);
  return {
    "@type": "OnlineStore" as const,
    "@id": organizationId,
    name: "Modempic",
    url: root,
    logo: organizationLogo(root),
    description: ORGANIZATION_DESCRIPTION,
    email: ORGANIZATION_SUPPORT_EMAIL,
    sameAs: [instagramUrl],
    currenciesAccepted: "USD",
    paymentAccepted: "Credit Card, Debit Card, Cryptocurrency",
    areaServed: { "@type": "Place" as const, name: "Worldwide" },
    contactPoint: [
      {
        "@type": "ContactPoint" as const,
        contactType: "customer support",
        email: ORGANIZATION_SUPPORT_EMAIL,
        availableLanguage: ["en"],
        url: `${root}/contact`,
      },
    ],
    hasMerchantReturnPolicy: merchantReturnPolicy(root),
    hasShippingService: organizationShippingService(),
  };
}

export function buildWebsiteJsonLd(baseUrl: string) {
  const { root, organizationId, websiteId } = siteGraphIds(baseUrl);
  return {
    "@type": "WebSite" as const,
    "@id": websiteId,
    name: "Modempic",
    url: root,
    inLanguage: "en",
    publisher: { "@id": organizationId },
    potentialAction: {
      "@type": "SearchAction" as const,
      target: {
        "@type": "EntryPoint" as const,
        urlTemplate: `${root}/shop?query={search_term_string}`,
      },
      "query-input": {
        "@type": "PropertyValueSpecification" as const,
        valueRequired: true,
        valueName: "search_term_string",
      },
    },
  };
}

export function buildSiteGraphJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org" as const,
    "@graph": [buildOrganizationJsonLd(baseUrl), buildWebsiteJsonLd(baseUrl)],
  };
}
