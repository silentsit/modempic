import { prisma } from "@/lib/db";
import { backfillProductVariantsForProduct } from "@/lib/catalog/product-variant-store";

/** Idempotent: ensures every product has ProductVariant rows and cart lines point at them. */
export async function backfillAllProductVariants(): Promise<{ products: number; cartLines: number }> {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      priceCents: true,
      compareAtCents: true,
      variants: true,
    },
  });

  let productCount = 0;
  for (const product of products) {
    await prisma.$transaction(async (tx) => {
      await backfillProductVariantsForProduct(tx, product);
    });
    productCount++;
  }

  const cartLines = await prisma.cartLine.findMany({
    where: { variantId: null },
    select: { id: true, productId: true, variantKey: true },
  });

  let linked = 0;
  for (const line of cartLines) {
    const variant = await prisma.productVariant.findFirst({
      where: { productId: line.productId, variantKey: line.variantKey, active: true },
    });
    if (!variant) continue;
    await prisma.cartLine.update({
      where: { id: line.id },
      data: { variantId: variant.id },
    });
    linked++;
  }

  return { products: productCount, cartLines: linked };
}
