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
    logo: `${root}/modempic-logo.png`,
    sameAs: [instagramUrl],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "info@modempic.com",
        availableLanguage: ["en"],
      },
    ],
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Modempic",
    url: `${root}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${root}/shop?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  const graph = { "@context": "https://schema.org", "@graph": [organization, website] };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
