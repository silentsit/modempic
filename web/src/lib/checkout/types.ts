export type CheckoutRedirectState = {
  redirectTo: string;
  cardCheckoutUrl?: string;
  cardCheckoutError?: string;
};

export type CheckoutState = { error: string } | CheckoutRedirectState | null;

export type CheckoutCouponPreview = {
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  subtotalAfterDiscountCents: number;
  appliedCode?: string;
  message?: string;
};
