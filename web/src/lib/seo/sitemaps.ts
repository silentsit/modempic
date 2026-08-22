import { isStorefrontCategoryVisible, productHasVisibleCategory } from "@/lib/catalog/category-visibility";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { toAbsoluteUrl, type SitemapIndexEntry, type SitemapUrl } from "@/lib/seo/sitemap-xml";

export { renderSitemapIndex, renderUrlset, sitemapXmlResponse } from "@/lib/seo/sitemap-xml";
export type { SitemapImage, SitemapIndexEntry, SitemapUrl } from "@/lib/seo/sitemap-xml";

export const STATIC_PAGE_PATHS = [
  "",
  "/shop",
  "/shop/best-sellers",
  "/about",
  "/faq",
  "/contact",
  "/how-to-pay",
  "/privacy-policy",
  "/terms-of-service",
  "/shipping",
  "/refund-policy",
] as const;

function newestDate(dates: Date[], fallback = new Date()) {
  if (dates.length === 0) return fallback;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

export function stylesheetHref(base = getSiteUrl()) {
  return `${base}/sitemap.xsl`;
}

export async function getPageSitemapUrls(base = getSiteUrl()): Promise<SitemapUrl[]> {
  const now = new Date();
  return STATIC_PAGE_PATHS.map((path) => ({
    loc: `${base}${path || "/"}`,
    lastmod: now,
  }));
}

export async function getProductSitemapUrls(base = getSiteUrl()): Promise<SitemapUrl[]> {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      name: true,
      updatedAt: true,
      images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
      categories: { select: { category: { select: { slug: true } } } },
    },
  });

  return products
    .filter((product) => productHasVisibleCategory(product.categories))
    .map((product) => ({
      loc: `${base}/product/${product.slug}`,
      lastmod: product.updatedAt,
      images: product.images
        .filter((image) => image.url)
        .map((image) => ({
          loc: toAbsoluteUrl(image.url, base),
          title: image.alt || product.name,
        })),
    }));
}

export async function getCategorySitemapUrls(base = getSiteUrl()): Promise<SitemapUrl[]> {
  const categories = await prisma.category.findMany({
    select: {
      slug: true,
      products: {
        where: { product: { status: "PUBLISHED" } },
        select: { product: { select: { updatedAt: true } } },
      },
    },
  });

  return categories
    .filter((category) => isStorefrontCategoryVisible(category.slug))
    .map((category) => ({
      loc: `${base}/shop/${category.slug}`,
      lastmod: newestDate(category.products.map((row) => row.product.updatedAt)),
    }));
}

export async function getPostSitemapUrls(base = getSiteUrl()): Promise<SitemapUrl[]> {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED", publishedAt: { not: null } },
    select: { slug: true, title: true, updatedAt: true, heroImageUrl: true },
    orderBy: { publishedAt: "desc" },
  });

  const newestPost = newestDate(posts.map((post) => post.updatedAt));
  return [
    { loc: `${base}/blog`, lastmod: newestPost },
    ...posts.map((post) => ({
      loc: `${base}/blog/${post.slug}`,
      lastmod: post.updatedAt,
      images: post.heroImageUrl
        ? [{ loc: toAbsoluteUrl(post.heroImageUrl, base), title: post.title }]
        : undefined,
    })),
  ];
}

export async function getSitemapIndexEntries(base = getSiteUrl()): Promise<SitemapIndexEntry[]> {
  try {
    const [pages, products, categories, posts] = await Promise.all([
      getPageSitemapUrls(base),
      getProductSitemapUrls(base),
      getCategorySitemapUrls(base),
      getPostSitemapUrls(base),
    ]);
    return [
      { loc: `${base}/page-sitemap.xml`, lastmod: newestDate(pages.map((item) => item.lastmod)) },
      { loc: `${base}/product-sitemap.xml`, lastmod: newestDate(products.map((item) => item.lastmod)) },
      { loc: `${base}/category-sitemap.xml`, lastmod: newestDate(categories.map((item) => item.lastmod)) },
      { loc: `${base}/post-sitemap.xml`, lastmod: newestDate(posts.map((item) => item.lastmod)) },
    ];
  } catch {
    const now = new Date();
    return [
      { loc: `${base}/page-sitemap.xml`, lastmod: now },
      { loc: `${base}/product-sitemap.xml`, lastmod: now },
      { loc: `${base}/category-sitemap.xml`, lastmod: now },
      { loc: `${base}/post-sitemap.xml`, lastmod: now },
    ];
  }
}
