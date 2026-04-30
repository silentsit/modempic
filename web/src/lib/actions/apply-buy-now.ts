"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { defaultCartVariantForListings } from "@/lib/cart-price";

/**
 * Replaces the cart with a single unit of the given product (Buy now from home / listings).
 * Called from checkout when `?buy=slug` is present.
 */
export async function applyBuyNowSlugIfNeeded(slug: string | null) {
  if (!slug) return;
  const session = await auth();
  if (!session?.user?.id) return;
  const product = await prisma.product.findFirst({
    where: { slug, status: ProductStatus.PUBLISHED },
  });
  if (!product) return;
  const cart = await prisma.cart.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });
  const picked = defaultCartVariantForListings(product);
  await prisma.cartLine.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartLine.create({
    data: {
      cartId: cart.id,
      productId: product.id,
      quantity: 1,
      unitPriceCents: picked.unitPriceCents,
      variantKey: picked.variantKey,
    },
  });
  revalidatePath("/checkout");
  revalidatePath("/cart");
}
