import type { Prisma } from "@prisma/client";

/**
 * Woo-style coupon evaluation: eligible line subtotal after product/category include+exclude
 * (excludes win), optional sale-item exclusion, then min/max spend on that eligible subtotal.
 */
export type CouponWithRules = Prisma.CouponGetPayload<{
  include: {
    productIncludes: true;
    productExcludes: true;
    categoryIncludes: true;
    categoryExcludes: true;
  };
}>;

export type CartLineForCoupon = {
  productId: string;
  lineTotalCents: number;
  categoryIds: string[];
  compareAtCents: number | null;
  unitPriceCents: number;
};

export type CouponEvalContext = {
  userId: string;
  userEmail: string | null;
  /** Prior completed / in-flight orders using this coupon (see checkout resolver). */
  userRedemptionCount: number;
};

export type CouponEvalResult = {
  discountCents: number;
  couponId?: string;
  appliedCode?: string;
  message?: string;
  /** When true, checkout should force shipping to $0 if it would otherwise be flat rate. */
  freeShipping: boolean;
};

function normalizeEmail(e: string): string {
  return e.trim().toLowerCase();
}

/** Parse comma-separated allowed emails; empty raw => no restriction. */
export function parseAllowedEmails(raw: string | null | undefined): string[] | null {
  if (raw == null || !String(raw).trim()) return null;
  const parts = String(raw)
    .split(/[;,]+/)
    .map((s) => normalizeEmail(s))
    .filter(Boolean);
  return parts.length ? parts : null;
}

function lineIsOnSale(line: CartLineForCoupon): boolean {
  return line.compareAtCents != null && line.compareAtCents > line.unitPriceCents;
}

function lineEligibleForCoupon(coupon: CouponWithRules, line: CartLineForCoupon): boolean {
  const exProd = new Set(coupon.productExcludes.map((r) => r.productId));
  if (exProd.has(line.productId)) return false;

  const exCat = new Set(coupon.categoryExcludes.map((r) => r.categoryId));
  if (line.categoryIds.some((id) => exCat.has(id))) return false;

  if (coupon.excludeSaleItems && lineIsOnSale(line)) return false;

  const incProd = coupon.productIncludes.map((r) => r.productId);
  if (incProd.length > 0 && !incProd.includes(line.productId)) return false;

  const incCat = coupon.categoryIncludes.map((r) => r.categoryId);
  if (incCat.length > 0 && !line.categoryIds.some((id) => incCat.includes(id))) return false;

  return true;
}

export function evaluateCouponForCart(
  coupon: CouponWithRules | null,
  couponCode: string,
  cartLines: CartLineForCoupon[],
  cartSubtotalPublishedCents: number,
  ctx: CouponEvalContext,
): CouponEvalResult {
  const code = couponCode.trim();
  if (!code) return { discountCents: 0, freeShipping: false };

  if (!coupon) return { discountCents: 0, message: "Promo code not found.", freeShipping: false };
  if (!coupon.active) return { discountCents: 0, message: "Promo code is inactive.", freeShipping: false };

  const now = new Date();
  const okTime = (!coupon.startsAt || coupon.startsAt <= now) && (!coupon.endsAt || coupon.endsAt >= now);
  if (!okTime) return { discountCents: 0, message: "Promo code is not valid right now.", freeShipping: false };

  if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { discountCents: 0, message: "Promo code has reached its redemption limit.", freeShipping: false };
  }

  if (coupon.usageLimitPerUser != null && ctx.userRedemptionCount >= coupon.usageLimitPerUser) {
    return { discountCents: 0, message: "You have already used this promo code the maximum number of times.", freeShipping: false };
  }

  const allowed = parseAllowedEmails(coupon.allowedEmails);
  if (allowed && allowed.length > 0) {
    const email = ctx.userEmail ? normalizeEmail(ctx.userEmail) : "";
    if (!email || !allowed.includes(email)) {
      return { discountCents: 0, message: "This promo code is not available for your account.", freeShipping: false };
    }
  }

  let eligibleSubtotal = 0;
  for (const line of cartLines) {
    if (lineEligibleForCoupon(coupon, line)) eligibleSubtotal += line.lineTotalCents;
  }

  if (eligibleSubtotal <= 0) {
    return {
      discountCents: 0,
      message: "Your cart does not qualify for this promo code.",
      freeShipping: false,
    };
  }

  if (eligibleSubtotal < coupon.minOrderCents) {
    return {
      discountCents: 0,
      message: "Cart subtotal does not meet this promo minimum.",
      freeShipping: false,
    };
  }

  if (coupon.maxOrderCents != null && eligibleSubtotal > coupon.maxOrderCents) {
    return {
      discountCents: 0,
      message: "Cart subtotal is above the maximum allowed for this promo code.",
      freeShipping: false,
    };
  }

  const type = coupon.type === "PERCENT" ? "PERCENT" : "FIXED";
  const discountCents =
    type === "PERCENT"
      ? Math.min(eligibleSubtotal, Math.floor((eligibleSubtotal * coupon.value) / 100))
      : Math.min(eligibleSubtotal, Math.max(0, coupon.value));

  return {
    discountCents,
    couponId: coupon.id,
    appliedCode: code.toUpperCase(),
    freeShipping: coupon.freeShipping,
  };
}
