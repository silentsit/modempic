import type { SerializedCoupon, CouponFormProduct } from "./coupon-form";

type CouponLoad = {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  minOrderCents: number;
  maxOrderCents: number | null;
  maxRedemptions: number | null;
  usageLimitPerUser: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  freeShipping: boolean;
  excludeSaleItems: boolean;
  allowedEmails: string | null;
  productIncludes: { product: CouponFormProduct }[];
  productExcludes: { product: CouponFormProduct }[];
  categoryIncludes: { categoryId: string }[];
  categoryExcludes: { categoryId: string }[];
};

export function serializeCouponForForm(c: CouponLoad): SerializedCoupon {
  return {
    id: c.id,
    code: c.code,
    description: c.description,
    type: c.type === "PERCENT" ? "PERCENT" : "FIXED",
    value: c.value,
    minOrderCents: c.minOrderCents,
    maxOrderCents: c.maxOrderCents,
    maxRedemptions: c.maxRedemptions,
    usageLimitPerUser: c.usageLimitPerUser,
    startsAtIso: c.startsAt?.toISOString() ?? null,
    endsAtIso: c.endsAt?.toISOString() ?? null,
    active: c.active,
    freeShipping: c.freeShipping,
    excludeSaleItems: c.excludeSaleItems,
    allowedEmails: c.allowedEmails,
    includeProducts: c.productIncludes.map((r) => r.product),
    excludeProducts: c.productExcludes.map((r) => r.product),
    includeCategoryIds: c.categoryIncludes.map((r) => r.categoryId),
    excludeCategoryIds: c.categoryExcludes.map((r) => r.categoryId),
  };
}
