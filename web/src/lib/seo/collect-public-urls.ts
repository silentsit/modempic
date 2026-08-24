import {
  getCategorySitemapUrls,
  getPageSitemapUrls,
  getPostSitemapUrls,
  getProductSitemapUrls,
} from "@/lib/seo/sitemaps";
import { getSiteUrl } from "@/lib/site-url";

/** All public storefront URLs that appear in child sitemaps (deduped). */
export async function collectPublicUrls(base = getSiteUrl()): Promise<string[]> {
  const [pages, products, categories, posts] = await Promise.all([
    getPageSitemapUrls(base),
    getProductSitemapUrls(base),
    getCategorySitemapUrls(base),
    getPostSitemapUrls(base),
  ]);

  return [...new Set([...pages, ...products, ...categories, ...posts].map((entry) => entry.loc))];
}

export function sitemapIndexUrl(base = getSiteUrl()) {
  return `${base.replace(/\/$/, "")}/sitemap.xml`;
}
