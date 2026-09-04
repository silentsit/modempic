import { CryptoAsset, PaymentStatus } from "@prisma/client";
import { gatewayProductDescriptor } from "@/lib/catalog/payment-code";
import { ensureCartRecord } from "@/lib/cart/owner";
import { clearCheckoutCart, loadCheckoutCart } from "@/lib/checkout/checkout-cart";
import {
  createPaymentoCheckoutSession,
  createPeptidePaySession,
  isReusableGatewayUrl,
  type CartRestoreLine,
} from "@/lib/checkout/checkout-payment-sessions";
import type { AccessibleCheckoutOrder } from "@/lib/checkout/checkout-order-access";
import { getSiteUrl } from "@/lib/site-url";

export type MintHostedPaymentResult =
  | { ok: true; url: string; alreadyPaid?: false }
  | { ok: false; error: string; alreadyPaid?: boolean };

function cartRestoreLinesFromOrder(order: AccessibleCheckoutOrder): CartRestoreLine[] {
  return order.lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    variantKey: line.variantKey ?? "default",
    variantId: line.variantId,
  }));
}

async function resolveCartForMint(order: AccessibleCheckoutOrder): Promise<{
  cartId: string;
  cartRestoreLines: CartRestoreLine[];
}> {
  const cart = await ensureCartRecord({ userId: order.userId });
  const loaded = await loadCheckoutCart(order.userId);
  const cartRestoreLines =
    loaded && loaded.items.length > 0
      ? loaded.items.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          variantKey: line.variantKey,
          variantId: line.variantId,
        }))
      : cartRestoreLinesFromOrder(order);
  return { cartId: cart.id, cartRestoreLines };
}

async function clearLeftoverCart(userId: string) {
  const cart = await loadCheckoutCart(userId);
  if (cart?.items.length) await clearCheckoutCart(cart.id);
}

export async function mintHostedPaymentForOrder(order: AccessibleCheckoutOrder): Promise<MintHostedPaymentResult> {
  const pay = order.payments[0];
  if (!pay) {
    return { ok: false, error: `Order ${order.orderNumber} has no payment method recorded.` };
  }
  if (pay.status === PaymentStatus.SUCCEEDED) {
    return { ok: false, error: `Order ${order.orderNumber} is already paid.`, alreadyPaid: true };
  }
  if (isReusableGatewayUrl(pay.payAddress, pay.expiresAt)) {
    await clearLeftoverCart(order.userId);
    return { ok: true, url: pay.payAddress! };
  }

  const { cartId, cartRestoreLines } = await resolveCartForMint(order);

  const baseUrl = getSiteUrl();
  const returnUrl = `${baseUrl}/order/${order.orderNumber}/confirmation`;

  if (pay.provider === "peptidepay") {
    const result = await createPeptidePaySession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      returnUrl,
      cancelUrl: returnUrl,
      webhookUrl: `${baseUrl}/api/webhooks/peptidepay`,
      email: order.user.email ?? "",
      productDescriptor: gatewayProductDescriptor(order.lines.map((line) => line.product.paymentCode)),
      cartId,
      cartRestoreLines,
    });
    return result.ok ? { ok: true, url: result.gatewayUrl } : { ok: false, error: result.error };
  }

  if (pay.provider === "paymento") {
    const result = await createPaymentoCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      returnUrl,
      asset: pay.asset ?? CryptoAsset.USDT,
      cartId,
      cartRestoreLines,
    });
    return result.ok ? { ok: true, url: result.gatewayUrl } : { ok: false, error: result.error };
  }

  return { ok: false, error: `Order ${order.orderNumber} is not waiting on a hosted payment page.` };
}
