import { CryptoAsset, PaymentStatus } from "@prisma/client";
import { ensureCartRecord } from "@/lib/cart/owner";
import { clearMatchingCheckoutCartLines } from "@/lib/checkout/checkout-cart";
import {
  createCardToUsdtCheckoutSession,
  createPaymentoCheckoutSession,
  isReusableGatewayUrl,
  type CartRestoreLine,
} from "@/lib/checkout/checkout-payment-sessions";
import { CARDTOUSDT_PROVIDER } from "@/lib/payments/cardtousdt";
import type { AccessibleCheckoutOrder } from "@/lib/checkout/checkout-order-access";
import { getSiteUrl } from "@/lib/site-url";

export type MintHostedPaymentResult =
  | { ok: true; url: string; alreadyPaid?: false; openInNewTab?: boolean }
  | { ok: false; error: string; alreadyPaid?: boolean };

function cartRestoreLinesFromOrder(order: AccessibleCheckoutOrder): CartRestoreLine[] {
  return order.lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    variantKey: line.variantKey ?? "",
    variantId: line.variantId,
  }));
}

async function resolveCartForMint(order: AccessibleCheckoutOrder): Promise<{
  cartId: string;
  cartRestoreLines: CartRestoreLine[];
}> {
  const cart = await ensureCartRecord({ userId: order.userId });
  return { cartId: cart.id, cartRestoreLines: cartRestoreLinesFromOrder(order) };
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
    const { cartId, cartRestoreLines } = await resolveCartForMint(order);
    await clearMatchingCheckoutCartLines(cartId, cartRestoreLines);
    return {
      ok: true,
      url: pay.payAddress!,
      openInNewTab: pay.provider === CARDTOUSDT_PROVIDER,
    };
  }

  const { cartId, cartRestoreLines } = await resolveCartForMint(order);

  const baseUrl = getSiteUrl();
  const returnUrl = `${baseUrl}/order/${order.orderNumber}/confirmation`;

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

  if (pay.provider === CARDTOUSDT_PROVIDER) {
    const result = await createCardToUsdtCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      buyerEmail: order.user.email ?? "",
      cartId,
      cartRestoreLines,
    });
    return result.ok
      ? { ok: true, url: result.gatewayUrl, openInNewTab: true }
      : { ok: false, error: result.error };
  }

  return { ok: false, error: `Order ${order.orderNumber} is not waiting on a hosted payment page.` };
}
