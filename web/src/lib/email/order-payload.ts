import type { Address } from "@prisma/client";
import { PaymentMethod } from "@prisma/client";
import type { EmailAddressBlock, OrderEmailPayload } from "@/lib/email/types";

function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.CARD_ONRAMP:
      return "Credit/Debit Cards (Visa/MasterCard/Amex/Discover)";
    case PaymentMethod.CRYPTO:
      return "Cryptocurrency";
    default:
      return String(method);
  }
}

function blockFromAddress(a: Address | null): EmailAddressBlock {
  if (!a) {
    return { fullName: "—", line1: "—", city: "—", state: "—", postal: "—" };
  }
  return {
    fullName: a.fullName,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    postal: a.postal,
    country: a.country,
    phone: a.phone,
  };
}

export function orderPayloadFromDb(order: {
  orderNumber: string;
  createdAt: Date;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  shippingMethod: string | null;
  lines: { title: string; quantity: number; lineTotalCents: number }[];
  shippingAddress: Address | null;
  billingAddress: Address | null;
  payments: { method: PaymentMethod }[];
  user: { name: string | null } | null;
}): OrderEmailPayload {
  const lastPay = order.payments[0];
  const fullName = order.shippingAddress?.fullName ?? order.user?.name ?? "Customer";
  return {
    orderNumber: order.orderNumber,
    customerFullName: fullName,
    orderDate: order.createdAt,
    lines: order.lines.map((l) => ({
      title: l.title,
      quantity: l.quantity,
      lineTotalCents: l.lineTotalCents,
    })),
    subtotalCents: order.subtotalCents,
    taxCents: order.taxCents,
    shippingCents: order.shippingCents,
    discountCents: order.discountCents,
    totalCents: order.totalCents,
    shippingMethod: order.shippingMethod ?? "Standard",
    paymentMethod: lastPay ? paymentMethodLabel(lastPay.method) : "Paid",
    shippingAddress: blockFromAddress(order.shippingAddress),
    billingAddress: blockFromAddress(order.billingAddress),
  };
}

export function placeholderVarsFromOrderPayload(payload: OrderEmailPayload): {
  customer_first_name: string;
  customer_full_name: string;
  order_number: string;
  order_date: string;
} {
  const first = payload.customerFullName.trim().split(/\s+/)[0] || "there";
  return {
    customer_first_name: first,
    customer_full_name: payload.customerFullName,
    order_number: payload.orderNumber,
    order_date: payload.orderDate.toISOString().slice(0, 10),
  };
}
