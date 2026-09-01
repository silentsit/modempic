import { merchantReturnPolicy } from "@/lib/seo/merchant-listing-policy";
import { organizationLocations, organizationPostalAddresses } from "@/lib/seo/organization-offices";
import { getSiteUrl } from "@/lib/site-url";

const instagramUrl =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/modempic";

/**
 * Sitewide Organization + WebSite JSON-LD. Helps Google build the brand knowledge panel and
 * (with `SearchAction`) eligibility for sitelinks search box.
 */
export function SiteJsonLd() {
  const root = getSiteUrl().replace(/\/$/, "");
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Modempic",
    url: `${root}/`,
    logo: `${root}/modempic-logo.svg`,
    sameAs: [instagramUrl],
    address: organizationPostalAddresses(),
    location: organizationLocations(),
    contactPoint: [
      {
        "@type": "ContactPoint",
        name: "Janine White",
        contactType: "customer support",
        telephone: "+66 62 027 2123",
        email: "info@modempic.com",
        availableLanguage: ["en"],
      },
    ],
    hasMerchantReturnPolicy: merchantReturnPolicy(root),
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Modempic",
    url: `${root}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${root}/shop?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
  const graph = { "@context": "https://schema.org", "@graph": [organization, website] };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
