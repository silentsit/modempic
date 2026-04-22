import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";

const b = getSiteUrl();

const staticPaths = [
  "",
  "/shop",
  "/shop/best-sellers",
  "/blog",
  "/about",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/shipping",
  "/refunds",
].map((path) => ({
  url: `${b}${path || "/"}`,
  lastModified: new Date(),
  changeFrequency: "weekly" as const,
  priority: path === "" ? 1 : 0.7,
}));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [products, posts, categories] = await Promise.all([
      prisma.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED", publishedAt: { not: null } },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({ select: { slug: true, id: true } }),
    ]);
    return [
      ...staticPaths,
      ...products.map((p) => ({
        url: `${b}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...categories.map((c) => ({
        url: `${b}/shop/${c.slug}`,
        lastModified: new Date(),
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
