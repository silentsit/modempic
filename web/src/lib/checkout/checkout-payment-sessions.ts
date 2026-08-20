import { CryptoAsset, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  paymentoCreatePaymentRequest,
  paymentoGatewayUrl,
  getPaymentoSpeedFromEnv,
} from "@/lib/payments/paymento";
import { clearCheckoutCart, restoreCartIfEmpty } from "@/lib/checkout/checkout-cart";

export type CartRestoreLine = {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  variantKey: string;
  variantId?: string | null;
};

export async function createPaymentoCheckoutSession(params: {
  orderId: string;
  orderNumber: string;
  totalCents: number;
  returnUrl: string;
  asset: CryptoAsset;
  cartId: string;
  cartRestoreLines: CartRestoreLine[];
}): Promise<{ ok: true; gatewayUrl: string } | { ok: false; error: string }> {
  const pr = await paymentoCreatePaymentRequest({
    fiatAmount: (params.totalCents / 100).toFixed(2),
    fiatCurrency: "USD",
    orderId: params.orderNumber,
    returnUrl: params.returnUrl,
    speed: getPaymentoSpeedFromEnv(),
    additionalData: [{ key: "internalOrderId", value: params.orderId }],
  });
  if (!pr.success) {
    await restoreCartIfEmpty(params.cartId, params.cartRestoreLines);
    return {
      ok: false,
      error: `Paymento: ${pr.error}. Order ${params.orderNumber} was created; contact support or retry from your orders list.`,
    };
  }
  const gateway = paymentoGatewayUrl(pr.token);
  const pay = await prisma.payment.create({
    data: {
      orderId: params.orderId,
      method: PaymentMethod.CRYPTO,
      status: PaymentStatus.PENDING,
      idempotencyKey: `paymento_init_${params.orderNumber}`,
      amountCents: params.totalCents,
      provider: "paymento",
      externalId: pr.token,
      payAddress: gateway,
      payAmountCrypto: "Paymento (crypto to merchant wallet)",
      asset: params.asset,
    },
  });
  await prisma.paymentEvent.create({
    data: {
      paymentId: pay.id,
      type: "PAYMENTO_REQUEST_CREATED",
      idempotencyKey: `paymento_evt_${params.orderNumber}`,
      payload: { returnUrl: params.returnUrl },
    },
  });
  await clearCheckoutCart(params.cartId);
  return { ok: true, gatewayUrl: gateway };
}
