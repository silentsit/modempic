"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import {
  defaultCartVariantForListings,
  resolveCartVariantFromTierIndex,
} from "@/lib/cart-price";

async function ensureCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

const addSchema = z.object({
  productId: z.string().min(1).max(128),
  quantity: z.coerce.number().int().min(1).max(99),
});

export async function addToCartAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
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

  const cart = await ensureCart(session.user.id);
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
}

/** Buy now: replace cart with a single line (per product spec). */
export async function buyNowAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
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

  const cart = await ensureCart(session.user.id);
  await prisma.cartLine.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartLine.create({
    data: { cartId: cart.id, productId, quantity, unitPriceCents, variantKey, variantId },
  });
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function updateCartLineAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const lineId = String(formData.get("lineId") ?? "");
  const quantity = Number(formData.get("quantity"));
  if (!lineId || !Number.isInteger(quantity) || quantity < 1) return;
  const line = await prisma.cartLine.findFirst({
    where: { id: lineId, cart: { userId: session.user.id } },
  });
  if (!line) return;
  if (quantity > 99) return;
  await prisma.cartLine.update({ where: { id: lineId }, data: { quantity } });
  revalidatePath("/cart");
}

export async function removeCartLineAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const lineId = String(formData.get("lineId") ?? "");
  const line = await prisma.cartLine.findFirst({
    where: { id: lineId, cart: { userId: session.user.id } },
  });
  if (!line) return;
  await prisma.cartLine.delete({ where: { id: lineId } });
  revalidatePath("/cart");
}
