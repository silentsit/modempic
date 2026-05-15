import { ProductStatus, ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";

export async function getPublishedProducts(options?: { bestSellersOnly?: boolean; take?: number }) {
  return prismaDevOr("getPublishedProducts", () =>
    prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        ...(options?.bestSellersOnly ? { isBestSeller: true } : {}),
      },
      take: options?.take,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
      },
      orderBy: [{ isBestSeller: "desc" }, { name: "asc" }],
    }),
  [],
  );
}

/**
 * Published products excluding `excludeProductId`, ranked by popularity proxy:
 * best-seller flag, then approved review count, then average rating.
 */
export async function getPopularRecommendations(excludeProductId: string, limit = 4) {
  return prismaDevOr(
    "getPopularRecommendations",
    async () => {
      const rows = await prisma.product.findMany({
        where: {
          status: ProductStatus.PUBLISHED,
          id: { not: excludeProductId },
        },
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          reviews: {
            where: { status: ReviewStatus.APPROVED },
            select: { rating: true },
          },
        },
      });

      const score = (p: (typeof rows)[number]) => {
        const n = p.reviews.length;
        const avg = n > 0 ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / n : 0;
        return (p.isBestSeller ? 10_000 : 0) + n * 100 + avg * 10;
      };

      rows.sort((a, b) => {
        const d = score(b) - score(a);
        if (d !== 0) return d;
        return a.name.localeCompare(b.name);
      });

      return rows.slice(0, limit).map(({ reviews, ...product }) => {
        const reviewCount = reviews.length;
        const avgRating =
          reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
        return { ...product, avgRating, reviewCount };
      });
    },
    [],
  );
}

export async function getProductBySlug(slug: string) {
  return prismaDevOr("getProductBySlug", () =>
    prisma.product.findFirst({
      where: { slug, status: ProductStatus.PUBLISHED },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
        reviews: {
          where: { status: ReviewStatus.APPROVED },
          take: 100,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, image: true } } },
        },
      },
    }),
  null,
  );
}

export async function getCategoryBySlug(slug: string) {
  return prismaDevOr("getCategoryBySlug", () =>
    prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { product: { status: ProductStatus.PUBLISHED } },
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: "asc" }, take: 1 },
                categories: { include: { category: { select: { slug: true } } } },
              },
            },
          },
        },
      },
    }),
  null,
  );
}

export async function listCategories() {
  return prismaDevOr("listCategories", () => prisma.category.findMany({ orderBy: { name: "asc" } }), []);
}
