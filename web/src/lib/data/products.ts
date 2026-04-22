import { ProductStatus } from "@prisma/client";
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

export async function getProductBySlug(slug: string) {
  return prismaDevOr("getProductBySlug", () =>
    prisma.product.findFirst({
      where: { slug, status: ProductStatus.PUBLISHED },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
        reviews: {
          where: { status: "APPROVED" },
          take: 12,
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
              include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
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
