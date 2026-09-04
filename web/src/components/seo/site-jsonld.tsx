import { JsonLd } from "@/components/seo/json-ld";
import { buildSiteGraphJsonLd } from "@/lib/seo/organization-json-ld";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Sitewide OnlineStore + WebSite JSON-LD. Helps Google build the merchant knowledge panel and
 * (with `SearchAction`) eligibility for sitelinks search box.
 */
export function SiteJsonLd() {
  return <JsonLd data={buildSiteGraphJsonLd(getSiteUrl())} />;
}
