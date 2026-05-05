"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import {
  defaultCartVariantForListings,
  resolveCartVariantFromTierIndex,
} from "@/lib/cart-price";

type Options = {
  /** PDP forwards the dropdown selection so the picked tier survives the auth round-trip. */
  tierIndex?: string | number | null;
  /** PDP quantity stepper value; clamped 1..99. */
  quantity?: string | number | null;
};

function clampQty(raw: Options["quantity"]): number {
  const n = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(n)) return 1;
  return Math.min(99, Math.max(1, Math.trunc(n)));
}

/**
 * Replaces the cart with a single line of the given product (Buy now from listings or PDP).
 * Called from the checkout page when `?buy=slug` is present. Silently no-ops for guests; the
 * checkout page redirects them to /login first and runs this on the post-login redirect.
 */
export async function applyBuyNowSlugIfNeeded(slug: string | null, options: Options = {}) {
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

  const tierRaw = options.tierIndex;
  const resolved =
    tierRaw != null && String(tierRaw).trim() !== ""
      ? resolveCartVariantFromTierIndex(product, tierRaw)
      : defaultCartVariantForListings(product);
  if ("error" in resolved) {
    /** Fall back to the listing default rather than blocking checkout if the tier index is stale. */
    const fallback = defaultCartVariantForListings(product);
    await replaceCart(cart.id, product.id, fallback.unitPriceCents, fallback.variantKey, clampQty(options.quantity));
  } else {
    await replaceCart(cart.id, product.id, resolved.unitPriceCents, resolved.variantKey, clampQty(options.quantity));
  }

  revalidatePath("/checkout");
  revalidatePath("/cart");
}

async function replaceCart(
  cartId: string,
  productId: string,
  unitPriceCents: number,
  variantKey: string,
  quantity: number,
) {
  await prisma.cartLine.deleteMany({ where: { cartId } });
  await prisma.cartLine.create({
    data: { cartId, productId, quantity, unitPriceCents, variantKey },
  });
}
