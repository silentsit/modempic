export type CheckoutState = { error: string } | { redirectTo: string } | null;

export type CheckoutCouponPreview = {
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  subtotalAfterDiscountCents: number;
  appliedCode?: string;
  message?: string;
};
