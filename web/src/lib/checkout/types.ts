export type CheckoutState =
  | { error: string }
  | { redirectTo: string }
  | {
      btcpayCheckout: {
        invoiceId: string;
        checkoutLink: string;
        orderNumber: string;
        confirmationUrl: string;
        btcpayUrl: string;
      };
    }
  | null;

export type CheckoutCouponPreview = {
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  subtotalAfterDiscountCents: number;
  appliedCode?: string;
  message?: string;
};
