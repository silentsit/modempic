import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  evaluateCouponForCart,
  type CartLineForCoupon,
  type CouponEvalResult,
} from "@/lib/domain/coupon-eval";

const COUPON_RULES_INCLUDE = {
  productIncludes: true,
  productExcludes: true,
  categoryIncludes: true,
  categoryExcludes: true,
} as const;

export async function resolveCouponForCheckout(
  userId: string,
  userEmail: string | null,
  couponCode: string | undefined,
  cartLines: CartLineForCoupon[],
  cartSubtotalCents: number,
): Promise<CouponEvalResult> {
  const raw = couponCode?.trim();
  if (!raw) return { discountCents: 0, freeShipping: false };
  const codeKey = raw.toUpperCase();
  const coupon = await prisma.coupon.findUnique({
    where: { code: codeKey },
    include: COUPON_RULES_INCLUDE,
  });
  if (!coupon) return { discountCents: 0, message: "Promo code not found.", freeShipping: false };

  const userRedemptionCount = await prisma.order.count({
    where: {
      userId,
      couponId: coupon.id,
      status: { notIn: [OrderStatus.DRAFT, OrderStatus.CANCELLED, OrderStatus.FAILED] },
    },
  });

  return evaluateCouponForCart(coupon, raw, cartLines, cartSubtotalCents, {
    userId,
    userEmail,
    userRedemptionCount,
  });
}
