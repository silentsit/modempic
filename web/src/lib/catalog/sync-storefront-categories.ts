import type { PrismaClient } from "@prisma/client";
import { STOREFRONT_CATEGORIES } from "./storefront-categories";

/** Upsert the four storefront categories and assign products from legacy source slugs. */
export async function syncStorefrontCategories(prisma: PrismaClient) {
  for (const def of STOREFRONT_CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: def.slug },
      create: { slug: def.slug, name: def.name },
      update: { name: def.name },
    });

    if (def.sourceSlugs.length === 0) continue;

    const sourceCats = await prisma.category.findMany({
      where: { slug: { in: [...def.sourceSlugs] } },
      select: { products: { select: { productId: true } } },
    });

    const productIds = [...new Set(sourceCats.flatMap((row) => row.products.map((link) => link.productId)))];
    if (productIds.length === 0) continue;

    await prisma.productCategory.createMany({
      data: productIds.map((productId) => ({ productId, categoryId: category.id })),
      skipDuplicates: true,
    });
  }
}
