"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import {
  defaultCartVariantForListings,
  resolveCartVariantFromTierIndex,
} from "@/lib/cart-price";
import { cartWhere, ensureCartRecord, mergeGuestCartIntoUser, requireCartOwner } from "@/lib/cart/owner";
import { auth } from "@/auth";

async function ensureVisitorCart() {
  const session = await auth();
  if (session?.user?.id) {
    await mergeGuestCartIntoUser(session.user.id);
  }
  const owner = await requireCartOwner();
  return ensureCartRecord(owner);
}

const addSchema = z.object({
  productId: z.string().min(1).max(128),
  quantity: z.coerce.number().int().min(1).max(99),
});

export async function addToCartAction(formData: FormData): Promise<void> {
  const parsed = addSchema.safeParse({ productId: formData.get("productId"), quantity: formData.get("quantity") ?? 1 });
  if (!parsed.success) throw new Error("CART_REJECTED");
  const { productId, quantity } = parsed.data;
  const product = await prisma.product.findFirst({
    where: { id: productId, status: ProductStatus.PUBLISHED },
    include: { productVariants: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!product) throw new Error("CART_REJECTED");
  const tierRaw = formData.get("tierIndex");
  const resolved =
    tierRaw != null && String(tierRaw).trim() !== ""
      ? resolveCartVariantFromTierIndex(product, tierRaw)
      : defaultCartVariantForListings(product);
  if ("error" in resolved) throw new Error("CART_REJECTED");
  const { unitPriceCents, variantKey, variantId } = resolved;

  const cart = await ensureVisitorCart();
  const existing = await prisma.cartLine.findUnique({
    where: { cartId_productId_variantKey: { cartId: cart.id, productId, variantKey } },
  });
  if (existing) {
    await prisma.cartLine.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartLine.create({
      data: { cartId: cart.id, productId, quantity, unitPriceCents, variantKey, variantId },
    });
  }
  revalidatePath("/cart");
  revalidatePath("/");
  const session = await auth();
  if (session?.user?.id) {
    const { touchAbandonedCartFunnel } = await import("@/lib/email/funnels/enroll");
    void touchAbandonedCartFunnel(session.user.id).catch((err) =>
      console.error("[funnel] abandoned cart touch failed", err),
    );
  }
}

/** Buy now: replace cart with a single line (per product spec). */
export async function buyNowAction(formData: FormData): Promise<void> {
  const parsed = addSchema.safeParse({ productId: formData.get("productId"), quantity: formData.get("quantity") ?? 1 });
  if (!parsed.success) throw new Error("CART_REJECTED");
  const { productId, quantity } = parsed.data;
  const product = await prisma.product.findFirst({
    where: { id: productId, status: ProductStatus.PUBLISHED },
    include: { productVariants: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!product) throw new Error("CART_REJECTED");
  const resolved = resolveCartVariantFromTierIndex(product, formData.get("tierIndex"));
  if ("error" in resolved) throw new Error("CART_REJECTED");
  const { unitPriceCents, variantKey, variantId } = resolved;

  const cart = await ensureVisitorCart();
  await prisma.cartLine.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartLine.create({
    data: { cartId: cart.id, productId, quantity, unitPriceCents, variantKey, variantId },
  });
  revalidatePath("/cart");
  revalidatePath("/checkout");
  const session = await auth();
  if (session?.user?.id) {
    const { touchAbandonedCartFunnel } = await import("@/lib/email/funnels/enroll");
    void touchAbandonedCartFunnel(session.user.id).catch((err) =>
      console.error("[funnel] abandoned cart touch failed", err),
    );
  }
}

export async function updateCartLineAction(formData: FormData): Promise<void> {
  const owner = await requireCartOwner();
  const lineId = String(formData.get("lineId") ?? "");
  const quantity = Number(formData.get("quantity"));
  if (!lineId || !Number.isInteger(quantity) || quantity < 1) return;
  const line = await prisma.cartLine.findFirst({
    where: { id: lineId, cart: cartWhere(owner) },
  });
  if (!line) return;
  if (quantity > 99) return;
  await prisma.cartLine.update({ where: { id: line.id }, data: { quantity } });
  revalidatePath("/cart");
  const session = await auth();
  if (session?.user?.id) {
    const { touchAbandonedCartFunnel } = await import("@/lib/email/funnels/enroll");
    void touchAbandonedCartFunnel(session.user.id).catch((err) =>
      console.error("[funnel] abandoned cart touch failed", err),
    );
  }
}

export async function removeCartLineAction(formData: FormData): Promise<void> {
  const owner = await requireCartOwner();
  const lineId = String(formData.get("lineId") ?? "");
  const line = await prisma.cartLine.findFirst({
    where: { id: lineId, cart: cartWhere(owner) },
  });
  if (!line) return;
  await prisma.cartLine.delete({ where: { id: line.id } });
  revalidatePath("/cart");
  const session = await auth();
  if (session?.user?.id) {
    const { touchAbandonedCartFunnel } = await import("@/lib/email/funnels/enroll");
    void touchAbandonedCartFunnel(session.user.id).catch((err) =>
      console.error("[funnel] abandoned cart touch failed", err),
    );
  }
}
