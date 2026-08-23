import { ProductStatus, ReviewStatus } from "@prisma/client";
import { productHasVisibleCategory } from "@/lib/catalog/category-visibility";
import {
  STOREFRONT_CATEGORIES,
  productCategorySlugsForQuery,
  storefrontCategoryBySlug,
} from "@/lib/catalog/storefront-categories";
import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";

const categoryProductsInclude = {
  products: {
    where: { product: { status: ProductStatus.PUBLISHED } },
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
          productVariants: { where: { active: true }, orderBy: { sortOrder: "asc" as const } },
          categories: {
            include: {
              category: { select: { id: true, name: true, slug: true, description: true } },
            },
          },
        },
      },
    },
  },
} as const;

export async function getPublishedProducts(options?: { bestSellersOnly?: boolean; take?: number }) {
  const rows = await prismaDevOr("getPublishedProducts", () =>
    prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        ...(options?.bestSellersOnly ? { isBestSeller: true } : {}),
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        productVariants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
      },
      orderBy: [{ isBestSeller: "desc" }, { name: "asc" }],
    }),
  [],
  );
  const visibleRows = rows.filter((product) => productHasVisibleCategory(product.categories));
  return typeof options?.take === "number" ? visibleRows.slice(0, options.take) : visibleRows;
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
          categories: { include: { category: { select: { slug: true } } } },
          reviews: {
            where: { status: ReviewStatus.APPROVED },
            select: { rating: true },
          },
        },
      });

      const visibleRows = rows.filter((product) => productHasVisibleCategory(product.categories));
      const score = (p: (typeof visibleRows)[number]) => {
        const n = p.reviews.length;
        const avg = n > 0 ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / n : 0;
        return (p.isBestSeller ? 10_000 : 0) + n * 100 + avg * 10;
      };

      visibleRows.sort((a, b) => {
        const d = score(b) - score(a);
        if (d !== 0) return d;
        return a.name.localeCompare(b.name);
      });

      return visibleRows.slice(0, limit).map(({ reviews, ...product }) => {
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
  const product = await prismaDevOr("getProductBySlug", () =>
    prisma.product.findFirst({
      where: { slug, status: ProductStatus.PUBLISHED },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        productVariants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
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
  if (!product || !productHasVisibleCategory(product.categories)) return null;
  return product;
}

export async function getPublishedProductSlugs() {
  const rows = await prismaDevOr(
    "getPublishedProductSlugs",
    () =>
      prisma.product.findMany({
        where: { status: ProductStatus.PUBLISHED },
        select: { slug: true, categories: { include: { category: { select: { slug: true } } } } },
        orderBy: { updatedAt: "desc" },
      }),
    [],
  );
  return rows
    .filter((product) => productHasVisibleCategory(product.categories))
    .map(({ slug }) => ({ slug }));
}

export async function getCategoryBySlug(slug: string) {
  return prismaDevOr(
    "getCategoryBySlug",
    async () => {
      const def = storefrontCategoryBySlug(slug);
      const querySlugs = def ? productCategorySlugsForQuery(slug) : [slug];
      const rows = await prisma.category.findMany({
        where: { slug: { in: querySlugs } },
        include: categoryProductsInclude,
      });

      const productById = new Map<string, (typeof rows)[number]["products"][number]>();
      for (const row of rows) {
        for (const link of row.products) {
          productById.set(link.product.id, link);
        }
      }
      const products = [...productById.values()];

      const primary = rows.find((row) => row.slug === slug);
      if (primary) return { ...primary, products };
      if (!def) return null;
      return {
        id: `storefront:${def.slug}`,
        slug: def.slug,
        name: def.name,
        description: null,
        seoTitle: null,
        seoDesc: null,
        products,
      };
    },
    null,
  );
}

export async function listCategories() {
  const rows = await prismaDevOr(
    "listCategories",
    () => prisma.category.findMany({ orderBy: { name: "asc" } }),
    [],
  );
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  return STOREFRONT_CATEGORIES.map((def) => {
    const row = bySlug.get(def.slug);
    return (
      row ?? {
        id: `storefront:${def.slug}`,
        slug: def.slug,
        name: def.name,
        description: null,
        seoTitle: null,
        seoDesc: null,
      }
    );
  });
}

export async function getCategorySlugs() {
  return STOREFRONT_CATEGORIES.map((category) => ({ slug: category.slug }));
}
