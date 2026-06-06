"use server";

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
 *
 * Returns whether the cart was updated (slug valid, product published). Callers that need a
 * fresh RSC tree should `redirect("/checkout")` after `true` — do not use `revalidatePath` from
 * a function invoked during page render.
 */
export async function applyBuyNowSlugIfNeeded(slug: string | null, options: Options = {}): Promise<boolean> {
  if (!slug) return false;
  const session = await auth();
  if (!session?.user?.id) return false;
  const product = await prisma.product.findFirst({
    where: { slug, status: ProductStatus.PUBLISHED },
    include: { productVariants: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!product) return false;
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
    await replaceCart(
      cart.id,
      product.id,
      fallback.unitPriceCents,
      fallback.variantKey,
      fallback.variantId,
      clampQty(options.quantity),
    );
  } else {
    await replaceCart(
      cart.id,
      product.id,
      resolved.unitPriceCents,
      resolved.variantKey,
      resolved.variantId,
      clampQty(options.quantity),
    );
  }

  const { touchAbandonedCartFunnel } = await import("@/lib/email/funnels/enroll");
  void touchAbandonedCartFunnel(session.user.id).catch((err) =>
    console.error("[funnel] abandoned cart touch failed", err),
  );

  return true;
}

async function replaceCart(
  cartId: string,
  productId: string,
  unitPriceCents: number,
  variantKey: string,
  variantId: string | undefined,
  quantity: number,
) {
  await prisma.cartLine.deleteMany({ where: { cartId } });
  await prisma.cartLine.create({
    data: { cartId, productId, quantity, unitPriceCents, variantKey, variantId },
  });
}
