import { env } from "@/lib/env";
import type { EmailAddressBlock, OrderEmailPayload } from "@/lib/email/types";
import { sendAdminNewOrderEmail, sendOrderPlacedEmail } from "@/lib/email/send";
import { checkoutShippingMethodLabel } from "@/lib/domain/checkout-pricing";
import type { CryptoCheckoutProvider } from "@/lib/payments/crypto-provider";
import type { CheckoutFormValue } from "@/lib/checkout/checkout-form";
import type { CheckoutOrderLineCreate } from "@/lib/checkout/checkout-order";

function toAddressBlock(a: CheckoutFormValue["ship"]): EmailAddressBlock {
  return {
    fullName: a.fullName,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    postal: a.postal,
    country: a.country ?? "US",
    phone: a.phone,
  };
}

export function checkoutPaymentMethodLabel(
  paymentMethod: "CRYPTO" | "CARD_ONRAMP",
  cryptoProvider: CryptoCheckoutProvider | null,
): string {
  if (paymentMethod === "CRYPTO" && cryptoProvider === "btcpay") return "Bitcoin / Lightning (BTCPay)";
  if (paymentMethod === "CRYPTO" && cryptoProvider === "paymento") return "Cryptocurrency";
  if (paymentMethod === "CRYPTO" && cryptoProvider === "sim") return "Cryptocurrency (test)";
  if (paymentMethod === "CRYPTO") return "Cryptocurrency";
  return "Credit/Debit Cards (Visa/MasterCard/Amex/Discover)";
}

export async function sendCheckoutOrderEmails(params: {
  customerEmail: string;
  orderNumber: string;
  orderDate: Date;
  shipAddr: CheckoutFormValue["ship"];
  billAddr: CheckoutFormValue["bill"];
  lineCreates: CheckoutOrderLineCreate[];
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  paymentMethod: "CRYPTO" | "CARD_ONRAMP";
  cryptoProvider: CryptoCheckoutProvider | null;
}): Promise<void> {
  const orderEmailPayload: OrderEmailPayload = {
    orderNumber: params.orderNumber,
    customerFullName: params.shipAddr.fullName,
    orderDate: params.orderDate,
    lines: params.lineCreates.map((l) => ({
      title: l.title,
      quantity: l.quantity,
      lineTotalCents: l.lineTotalCents,
    })),
    subtotalCents: params.subtotalCents,
    taxCents: params.taxCents,
    shippingCents: params.shippingCents,
    discountCents: params.discountCents,
    totalCents: params.totalCents,
    shippingMethod: checkoutShippingMethodLabel(params.shippingCents),
    paymentMethod: checkoutPaymentMethodLabel(params.paymentMethod, params.cryptoProvider),
    shippingAddress: toAddressBlock(params.shipAddr),
    billingAddress: toAddressBlock(params.billAddr),
  };

  try {
    await sendOrderPlacedEmail(params.customerEmail, { ...orderEmailPayload, paymentStatus: "pending" });
    if (env.ADMIN_ORDER_NOTIFICATION_EMAIL) {
      await sendAdminNewOrderEmail(env.ADMIN_ORDER_NOTIFICATION_EMAIL, orderEmailPayload);
    }
  } catch (emailErr) {
    console.error("[EMAIL] checkout order emails failed", emailErr);
  }
}
