"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import {
  defaultCartVariantForListings,
  resolveCartVariantFromTierIndex,
} from "@/lib/cart-price";
import { ensureCartRecord, mergeGuestCartIntoUser, resolveCartOwner } from "@/lib/cart/owner";

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
 * Called from the checkout page when `?buy=slug` is present. Guests need the guest-cart cookie,
 * which middleware sets on `/checkout`.
 */
export async function applyBuyNowSlugIfNeeded(slug: string | null, options: Options = {}): Promise<boolean> {
  if (!slug) return false;
  const session = await auth();
  if (session?.user?.id) {
    await mergeGuestCartIntoUser(session.user.id);
  }
  const owner = await resolveCartOwner();
  if (!owner) return false;
  const product = await prisma.product.findFirst({
    where: { slug, status: ProductStatus.PUBLISHED },
    include: { productVariants: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!product) return false;
  const cart = await ensureCartRecord(owner);

  const tierRaw = options.tierIndex;
  const resolved =
    tierRaw != null && String(tierRaw).trim() !== ""
      ? resolveCartVariantFromTierIndex(product, tierRaw)
      : defaultCartVariantForListings(product);
  if ("error" in resolved) {
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

  if (session?.user?.id) {
    const { touchAbandonedCartFunnel } = await import("@/lib/email/funnels/enroll");
    void touchAbandonedCartFunnel(session.user.id).catch((err) =>
      console.error("[funnel] abandoned cart touch failed", err),
    );
  }

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
