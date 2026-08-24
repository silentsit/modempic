import { mappedStorefrontSlug } from "@/lib/catalog/storefront-categories";
import { submitIndexNow, type IndexNowResult } from "@/lib/seo/indexnow";
import { getSiteUrl } from "@/lib/site-url";

/** Paths to ping when a published product is created or updated (matches storefront revalidation). */
export function indexNowPathsForProduct(slug: string, categorySlugs: string[] = []) {
  const paths = ["/", "/shop", "/shop/best-sellers", `/product/${slug}`];
  for (const categorySlug of categorySlugs) {
    paths.push(`/shop/${categorySlug}`);
    const mapped = mappedStorefrontSlug(categorySlug);
    if (mapped) paths.push(`/shop/${mapped}`);
  }
  return paths;
}

/** Paths to ping when a published blog post is created or updated. */
export function indexNowPathsForBlog(slug: string, previousSlug?: string | null) {
  const paths = ["/blog", `/blog/${slug}`];
  if (previousSlug && previousSlug !== slug) paths.push(`/blog/${previousSlug}`);
  return paths;
}

function pathsToAbsoluteUrls(paths: string[]) {
  const base = getSiteUrl().replace(/\/$/, "");
  return [...new Set(paths.map((path) => `${base}${path.startsWith("/") ? path : `/${path}`}`))];
}

export type IndexNowPublishResult = IndexNowResult | { skipped: true };

/**
 * Notify IndexNow of changed public URLs after publish. No-ops when INDEXNOW_API_KEY is unset.
 * Failures are logged but do not throw — publish should not fail if Bing/Yandex is down.
 */
export async function pingIndexNowOnPublish(paths: string[]): Promise<IndexNowPublishResult> {
  const key = process.env.INDEXNOW_API_KEY?.trim();
  if (!key || paths.length === 0) return { skipped: true };

  const result = await submitIndexNow(pathsToAbsoluteUrls(paths), { apiKey: key });
  if (!result.ok) {
    console.warn("[indexnow:on-publish]", result.error ?? result.status);
  }
  return result;
}
