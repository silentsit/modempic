import { OrderStatus, ProductStatus } from "@prisma/client";
import { productHasVisibleCategory } from "@/lib/catalog/category-visibility";
import { pickMostPurchasedSlug, type PurchaseAggregate } from "@/lib/catalog/most-purchased-slug";
import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";

export async function getMostPurchasedProductSlug(): Promise<string | null> {
  return prismaDevOr(
    "getMostPurchasedProductSlug",
    async () => {
      const lines = await prisma.orderLine.findMany({
        where: {
          order: { status: OrderStatus.COMPLETED },
          product: { status: ProductStatus.PUBLISHED },
        },
        select: {
          quantity: true,
          product: {
            select: {
              slug: true,
              categories: { include: { category: { select: { slug: true } } } },
            },
          },
        },
      });

      const bySlug = new Map<string, PurchaseAggregate>();

      for (const line of lines) {
        const slug = line.product.slug;
        const visible = productHasVisibleCategory(line.product.categories);
        const current = bySlug.get(slug) ?? { slug, quantity: 0, visible };
        current.quantity += line.quantity;
        current.visible = current.visible || visible;
        bySlug.set(slug, current);
      }

      return pickMostPurchasedSlug(Array.from(bySlug.values()));
    },
    null,
  );
}
