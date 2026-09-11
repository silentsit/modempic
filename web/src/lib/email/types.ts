export type EmailAddressBlock = {
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal: string;
  country?: string | null;
  phone?: string | null;
};

export type OrderLineEmail = { title: string; quantity: number; lineTotalCents: number };

export type OrderEmailPayload = {
  orderNumber: string;
  customerFullName: string;
  orderDate: Date;
  lines: OrderLineEmail[];
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  shippingMethod: string;
  paymentMethod: string;
  shippingAddress: EmailAddressBlock;
  billingAddress: EmailAddressBlock;
  /** Extra instructions shown under the intro, e.g. manual card payment-link steps. */
  notice?: string;
};
