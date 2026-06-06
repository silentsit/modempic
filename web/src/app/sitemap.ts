import type { MetadataRoute } from "next";
import { isStorefrontCategoryVisible } from "@/lib/catalog/category-visibility";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";

const b = getSiteUrl();
const staticLastModified = new Date();

const staticPaths = [
  "",
  "/shop",
  "/shop/best-sellers",
  "/blog",
  "/about",
  "/faq",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
  "/shipping",
  "/refund-policy",
].map((path) => ({
  url: `${b}${path || "/"}`,
  lastModified: staticLastModified,
  changeFrequency: "weekly" as const,
  priority: path === "" ? 1 : 0.7,
}));

function newestDate(dates: Date[]) {
  if (dates.length === 0) return staticLastModified;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [products, posts, categories] = await Promise.all([
      prisma.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED", publishedAt: { not: null } },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        select: {
          slug: true,
          products: {
            where: { product: { status: "PUBLISHED" } },
            select: { product: { select: { updatedAt: true } } },
          },
        },
      }),
    ]);
    return [
      ...staticPaths,
      ...products.map((p) => ({
        url: `${b}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...categories
        .filter((c) => isStorefrontCategoryVisible(c.slug))
        .map((c) => ({
          url: `${b}/shop/${c.slug}`,
          lastModified: newestDate(c.products.map((pc) => pc.product.updatedAt)),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      ...posts.map((p) => ({
        url: `${b}/blog/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticPaths;
  }
}
