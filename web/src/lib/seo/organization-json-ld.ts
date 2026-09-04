import { merchantReturnPolicy, organizationShippingService } from "@/lib/seo/merchant-listing-policy";
import { organizationLocations, organizationPostalAddresses } from "@/lib/seo/organization-offices";
import { ORGANIZATION_SUPPORT_EMAIL, siteGraphIds } from "@/lib/seo/page-json-ld";

export const ORGANIZATION_DESCRIPTION =
  "Hard-to-find medicines at guaranteed best prices. Clear labels, pack-size pricing, and secure card or crypto checkout.";

export const ORGANIZATION_TELEPHONE = "+66 62 027 2123";

const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/modempic";

export function buildOrganizationJsonLd(baseUrl: string) {
  const { root, organizationId } = siteGraphIds(baseUrl);
  return {
    "@type": "OnlineStore" as const,
    "@id": organizationId,
    name: "Modempic",
    url: root,
    logo: {
      "@type": "ImageObject" as const,
      url: `${root}/modempic-logo.png`,
    },
    description: ORGANIZATION_DESCRIPTION,
    email: ORGANIZATION_SUPPORT_EMAIL,
    telephone: ORGANIZATION_TELEPHONE,
    sameAs: [instagramUrl],
    address: organizationPostalAddresses(),
    location: organizationLocations(),
    contactPoint: [
      {
        "@type": "ContactPoint" as const,
        contactType: "customer support",
        telephone: ORGANIZATION_TELEPHONE,
        email: ORGANIZATION_SUPPORT_EMAIL,
        availableLanguage: ["en", "th", "zh"],
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
    publisher: { "@id": organizationId },
    potentialAction: {
      "@type": "SearchAction" as const,
      target: {
        "@type": "EntryPoint" as const,
        urlTemplate: `${root}/shop?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildSiteGraphJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org" as const,
    "@graph": [buildOrganizationJsonLd(baseUrl), buildWebsiteJsonLd(baseUrl)],
  };
}
