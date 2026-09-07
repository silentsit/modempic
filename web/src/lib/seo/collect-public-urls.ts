import {
  getCategorySitemapUrls,
  getCompareSitemapUrls,
  getPageSitemapUrls,
  getPostSitemapUrls,
  getProductSitemapUrls,
  getShippingCountrySitemapUrls,
} from "@/lib/seo/sitemaps";
import { getSiteUrl } from "@/lib/site-url";

/** All public storefront URLs that appear in child sitemaps (deduped). */
export async function collectPublicUrls(base = getSiteUrl()): Promise<string[]> {
  const [pages, products, categories, posts, compares, shippingCountries] = await Promise.all([
    getPageSitemapUrls(base),
    getProductSitemapUrls(base),
    getCategorySitemapUrls(base),
    getPostSitemapUrls(base),
    getCompareSitemapUrls(base),
    getShippingCountrySitemapUrls(base),
  ]);

  return [
    ...new Set(
      [...pages, ...products, ...categories, ...posts, ...compares, ...shippingCountries].map((entry) => entry.loc),
    ),
  ];
}

export function sitemapIndexUrl(base = getSiteUrl()) {
  return `${base.replace(/\/$/, "")}/sitemap.xml`;
}
