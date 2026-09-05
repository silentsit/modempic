import { isStorefrontCategoryVisible, productHasVisibleCategory } from "@/lib/catalog/category-visibility";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { staticPageLoc, toAbsoluteUrl, type SitemapIndexEntry, type SitemapUrl } from "@/lib/seo/sitemap-xml";

export { renderSitemapIndex, renderUrlset, sitemapXmlResponse, staticPageLoc } from "@/lib/seo/sitemap-xml";
export type { SitemapImage, SitemapIndexEntry, SitemapUrl } from "@/lib/seo/sitemap-xml";

export const STATIC_PAGE_PATHS = [
  "",
  "/shop",
  "/shop/best-sellers",
  "/about",
  "/faq",
  "/contact",
  "/how-to-pay",
  "/where-to-buy-modafinil-online",
  "/privacy-policy",
  "/terms-of-service",
  "/shipping",
  "/refund-policy",
  "/sitemap",
] as const;

function newestDate(dates: Array<Date | undefined>): Date | undefined {
  const valid = dates.filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime()));
  if (valid.length === 0) return undefined;
  return new Date(Math.max(...valid.map((date) => date.getTime())));
}

export function stylesheetHref(base = getSiteUrl()) {
  return `${base}/sitemap.xsl`;
}

export async function getPageSitemapUrls(base = getSiteUrl()): Promise<SitemapUrl[]> {
  let newestProduct: Date | undefined;
  let newestPost: Date | undefined;
  try {
    const [productAgg, postAgg] = await Promise.all([
      prisma.product.aggregate({
        where: { status: "PUBLISHED" },
        _max: { updatedAt: true },
      }),
      prisma.blogPost.aggregate({
        where: { status: "PUBLISHED", publishedAt: { not: null } },
        _max: { updatedAt: true },
      }),
    ]);
    newestProduct = productAgg._max.updatedAt ?? undefined;
    newestPost = postAgg._max.updatedAt ?? undefined;
  } catch {
    // lastmod is optional; static locs must still publish if the catalog query fails
  }
  const homeLastmod = newestDate([newestProduct, newestPost]);

  return STATIC_PAGE_PATHS.map((path) => {
    const loc = staticPageLoc(base, path);
    if (path === "") return { loc, lastmod: homeLastmod };
    if (path === "/shop" || path === "/shop/best-sellers") return { loc, lastmod: newestProduct };
    return { loc };
  });
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
    orderBy: [{ updatedAt: "desc" }, { publishedAt: "desc" }],
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
    return [
      { loc: `${base}/page-sitemap.xml` },
      { loc: `${base}/product-sitemap.xml` },
      { loc: `${base}/category-sitemap.xml` },
      { loc: `${base}/post-sitemap.xml` },
    ];
  }
}
