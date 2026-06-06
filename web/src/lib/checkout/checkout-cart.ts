import { revalidatePath } from "next/cache";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CartLineForCoupon } from "@/lib/domain/coupon-eval";
import type { CryptoCheckoutProvider } from "@/lib/payments/crypto-provider";

export function genOrderNumber() {
  return `MP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function clearCheckoutCart(cartId: string) {
  await prisma.cartLine.deleteMany({ where: { cartId } });
  revalidatePath("/cart");
  revalidatePath("/");
}

export async function restoreCartIfEmpty(
  cartId: string,
  lines: { productId: string; quantity: number; unitPriceCents: number; variantKey: string; variantId?: string | null }[],
) {
  const count = await prisma.cartLine.count({ where: { cartId } });
  if (count > 0) return;
  for (const line of lines) {
    await prisma.cartLine.create({
      data: {
        cartId,
        productId: line.productId,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        variantKey: line.variantKey,
        variantId: line.variantId ?? undefined,
      },
    });
  }
  revalidatePath("/cart");
  revalidatePath("/");
}

export function defersCartClearUntilGateway(
  paymentMethod: "CRYPTO" | "CARD_ONRAMP",
  cryptoProvider: CryptoCheckoutProvider | null,
): boolean {
  return paymentMethod === "CRYPTO" && (cryptoProvider === "btcpay" || cryptoProvider === "paymento");
}

const CHECKOUT_CART_INCLUDE = {
  items: {
    include: {
      variant: true,
      product: {
        include: {
          categories: true,
          productVariants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
        },
      },
    },
  },
} as const;

export async function loadCheckoutCart(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
    include: CHECKOUT_CART_INCLUDE,
  });
}

export type LoadedCheckoutCart = NonNullable<Awaited<ReturnType<typeof loadCheckoutCart>>>;

export function buildCartLinesForCoupon(cart: LoadedCheckoutCart): CartLineForCoupon[] {
  return cart.items
    .filter((line) => line.product.status === ProductStatus.PUBLISHED)
    .map((line) => ({
      productId: line.productId,
      lineTotalCents: line.unitPriceCents * line.quantity,
      categoryIds: line.product.categories.map((c) => c.categoryId),
      compareAtCents: line.product.compareAtCents,
      unitPriceCents: line.unitPriceCents,
    }));
}
