/**
 * Legacy off-topic posts that Google already discovered via sitemap.
 * Keep the URLs live with noindex so they can be recrawled and dropped
 * from the discovery queue without competing for crawl demand.
 */
export const NOINDEX_BLOG_SLUGS = [
  "10-benefits-of-dmt-meditation",
  "what-is-dmt-meditation",
  "ho-oponopono-meditation",
] as const;

const noindexBlogSlugSet = new Set<string>(NOINDEX_BLOG_SLUGS);

export function isIndexableBlogSlug(slug: string) {
  return !noindexBlogSlugSet.has(slug);
}
