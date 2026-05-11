import type { OrderEmailPayload } from "@/lib/email/types";

/** Sample data for the admin email customizer preview (not a real order). */
export const PREVIEW_ORDER_PAYLOAD: OrderEmailPayload = {
  orderNumber: "MP-DEMO-19110",
  customerFullName: "Kathleen Dillon",
  orderDate: new Date("2024-03-09T15:00:00.000Z"),
  lines: [
    {
      title: "Buy Modalert 200 mg — 300 pills — $209.99 — ($0.70/pill) (#3692) Select Quantity: 300 pills",
      quantity: 2,
      lineTotalCents: 41998,
    },
  ],
  subtotalCents: 41998,
  taxCents: 0,
  shippingCents: 0,
  discountCents: 0,
  totalCents: 41998,
  shippingMethod: "Express Shipping",
  paymentMethod: "Credit/Debit Cards (Visa/MasterCard/Amex/Discover)",
  shippingAddress: {
    fullName: "Kathleen Dillon",
    line1: "123 Example Lane",
    line2: null,
    city: "Golden Valley",
    state: "MN",
    postal: "55422",
    country: "US",
    phone: "+1 (555) 010-0199",
  },
  billingAddress: {
    fullName: "Kathleen Dillon",
    line1: "123 Example Lane",
    line2: null,
    city: "Golden Valley",
    state: "MN",
    postal: "55422",
    country: "US",
    phone: "+1 (555) 010-0199",
  },
};
