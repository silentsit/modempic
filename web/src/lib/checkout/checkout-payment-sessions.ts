import { CryptoAsset, PaymentMethod, PaymentStatus, type Payment } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  paymentoCreatePaymentRequest,
  paymentoGatewayUrl,
  getPaymentoSpeedFromEnv,
} from "@/lib/payments/paymento";
import { peptidePayCreateCheckoutSession } from "@/lib/payments/peptidepay";
import { clearCheckoutCart, restoreCartIfEmpty } from "@/lib/checkout/checkout-cart";

export function isReusableGatewayUrl(url: string | null | undefined, expiresAt?: Date | null): boolean {
  if (!url || !url.startsWith("http")) return false;
  if (expiresAt && expiresAt.getTime() <= Date.now()) return false;
  return true;
}

function reusableGatewayFromPayment(payment: Payment | null): string | null {
  if (!payment) return null;
  if (payment.status === PaymentStatus.FAILED || payment.status === PaymentStatus.EXPIRED) return null;
  if (isReusableGatewayUrl(payment.payAddress, payment.expiresAt)) {
    return payment.payAddress ?? null;
  }
  return null;
}

async function latestPayment(orderId: string, provider: string) {
  return prisma.payment.findFirst({
    where: { orderId, provider },
    orderBy: { createdAt: "desc" },
  });
}

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
  const existing = await latestPayment(params.orderId, "paymento");
  if (existing?.status === PaymentStatus.SUCCEEDED) {
    return { ok: false, error: `Order ${params.orderNumber} is already paid.` };
  }
  const reused = reusableGatewayFromPayment(existing);
  if (reused) return { ok: true, gatewayUrl: reused };

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
  const payData = {
    method: PaymentMethod.CRYPTO,
    status: PaymentStatus.PENDING,
    amountCents: params.totalCents,
    provider: "paymento",
    externalId: pr.token,
    payAddress: gateway,
    payAmountCrypto: "Paymento (crypto to merchant wallet)",
    asset: params.asset,
    failureReason: null,
  };
  const pay = existing
    ? await prisma.payment.update({ where: { id: existing.id }, data: payData })
    : await prisma.payment.create({
        data: {
          orderId: params.orderId,
          idempotencyKey: `paymento_init_${params.orderNumber}`,
          ...payData,
        },
      });
  await prisma.paymentEvent.upsert({
    where: { idempotencyKey: `paymento_evt_${params.orderNumber}` },
    create: {
      paymentId: pay.id,
      type: "PAYMENTO_REQUEST_CREATED",
      idempotencyKey: `paymento_evt_${params.orderNumber}`,
      payload: { returnUrl: params.returnUrl },
    },
    update: { payload: { returnUrl: params.returnUrl } },
  });
  await clearCheckoutCart(params.cartId);
  return { ok: true, gatewayUrl: gateway };
}

export async function createPeptidePaySession(params: {
  orderId: string;
  orderNumber: string;
  totalCents: number;
  returnUrl: string;
  cancelUrl: string;
  webhookUrl: string;
  email: string;
  productDescriptor?: string;
  cartId: string;
  cartRestoreLines: CartRestoreLine[];
}): Promise<{ ok: true; gatewayUrl: string } | { ok: false; error: string }> {
  const existing = await latestPayment(params.orderId, "peptidepay");
  if (existing?.status === PaymentStatus.SUCCEEDED) {
    return { ok: false, error: `Order ${params.orderNumber} is already paid.` };
  }
  const reused = reusableGatewayFromPayment(existing);
  if (reused) return { ok: true, gatewayUrl: reused };

  const pr = await peptidePayCreateCheckoutSession({
    amountCents: params.totalCents,
    currency: "USD",
    email: params.email,
    successUrl: params.returnUrl,
    cancelUrl: params.cancelUrl,
    webhookUrl: params.webhookUrl,
    orderId: params.orderNumber,
    productDescriptor: params.productDescriptor,
    idempotencyKey: params.orderId,
  });
  if (!pr.success) {
    await restoreCartIfEmpty(params.cartId, params.cartRestoreLines);
    return {
      ok: false,
      error: `Card checkout: ${pr.error}. Order ${params.orderNumber} was created; contact support or retry from your orders list.`,
    };
  }
  const payData = {
    method: PaymentMethod.CARD_ONRAMP,
    status: PaymentStatus.PENDING,
    amountCents: params.totalCents,
    provider: "peptidepay",
    externalId: pr.id,
    payAddress: pr.url,
    payAmountCrypto: "PeptidePay (card / Apple Pay / Google Pay)",
    failureReason: null,
  };
  const pay = existing
    ? await prisma.payment.update({ where: { id: existing.id }, data: payData })
    : await prisma.payment.create({
        data: {
          orderId: params.orderId,
          idempotencyKey: `peptidepay_init_${params.orderNumber}`,
          ...payData,
        },
      });
  await prisma.paymentEvent.upsert({
    where: { idempotencyKey: `peptidepay_evt_${params.orderNumber}` },
    create: {
      paymentId: pay.id,
      type: "PEPTIDEPAY_SESSION_CREATED",
      idempotencyKey: `peptidepay_evt_${params.orderNumber}`,
      payload: { returnUrl: params.returnUrl, sessionId: pr.id },
    },
    update: { payload: { returnUrl: params.returnUrl, sessionId: pr.id } },
  });
  await clearCheckoutCart(params.cartId);
  return { ok: true, gatewayUrl: pr.url };
}
