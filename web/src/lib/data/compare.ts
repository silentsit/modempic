import { ProductStatus, ReviewStatus } from "@prisma/client";
import { cache } from "react";
import { productHasVisibleCategory } from "@/lib/catalog/category-visibility";
import { buildComparePairs, type ComparePair } from "@/lib/compare/pairs";
import { isIndexableComparePair, type CompareGateProduct } from "@/lib/compare/quality-gate";
import { prismaDevOr } from "@/lib/data/prisma-fallback";
import { prisma } from "@/lib/db";

const compareProductInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  productVariants: { where: { active: true }, orderBy: { sortOrder: "asc" as const } },
  categories: { include: { category: { select: { slug: true, name: true } } } },
  reviews: {
    where: { status: ReviewStatus.APPROVED },
    orderBy: { createdAt: "desc" as const },
    take: 8,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      authorName: true,
      createdAt: true,
    },
  },
  _count: {
    select: {
      reviews: { where: { status: ReviewStatus.APPROVED } },
    },
  },
} as const;

export type CompareProductRecord = Awaited<ReturnType<typeof loadCompareProducts>>[number];

function toGateProduct(product: {
  slug: string;
  name: string;
  status: ProductStatus;
  manufacturer: string | null;
  activeIngredient: string | null;
  strengthMg: number | null;
  variants: unknown;
  isBestSeller: boolean;
  productVariants: Array<{
    label: string;
    priceCents: number;
    compareAtCents: number | null;
    sortOrder: number;
    active: boolean;
  }>;
  reviews: unknown[];
  _count?: { reviews: number };
}): CompareGateProduct & { isBestSeller: boolean } {
  return {
    slug: product.slug,
    name: product.name,
    status: product.status,
    manufacturer: product.manufacturer,
    activeIngredient: product.activeIngredient,
    strengthMg: product.strengthMg,
    variants: product.variants,
    productVariants: product.productVariants,
    approvedReviewCount: product._count?.reviews ?? product.reviews.length,
    isBestSeller: product.isBestSeller,
  };
}

export const loadCompareProducts = cache(async () => {
  const rows = await prismaDevOr(
    "loadCompareProducts",
    () =>
      prisma.product.findMany({
        where: { status: ProductStatus.PUBLISHED },
        include: compareProductInclude,
        orderBy: { name: "asc" },
      }),
    [],
  );
  return rows.filter(
    (product) => productHasVisibleCategory(product.categories) && !product.slug.startsWith("e2e-"),
  );
});

export const getIndexableComparePairs = cache(async (): Promise<ComparePair[]> => {
  const products = await loadCompareProducts();
  return buildComparePairs(products.map(toGateProduct));
});

export async function getComparePairByParam(param: string) {
  const pairs = await getIndexableComparePairs();
  return pairs.find((pair) => pair.param === param) ?? null;
}

export async function getCompareProductsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  const products = await loadCompareProducts();
  const wanted = new Set(slugs);
  return products.filter((product) => wanted.has(product.slug));
}

export async function getComparisonsForProduct(slug: string, limit = 6): Promise<ComparePair[]> {
  const pairs = await getIndexableComparePairs();
  return pairs.filter((pair) => pair.leftSlug === slug || pair.rightSlug === slug).slice(0, limit);
}

export function pairPassesGate(left: CompareProductRecord, right: CompareProductRecord) {
  return isIndexableComparePair(toGateProduct(left), toGateProduct(right)).ok;
}
