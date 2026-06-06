import { CryptoAsset, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { btcpayCreateInvoice, getBtcpayPublicUrl } from "@/lib/payments/btcpay";
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

export type BtcpayCheckoutSession = {
  invoiceId: string;
  checkoutLink: string;
  orderNumber: string;
  confirmationUrl: string;
  btcpayUrl: string;
};

export async function createBtcpayCheckoutSession(params: {
  orderId: string;
  orderNumber: string;
  totalCents: number;
  returnUrl: string;
  email: string;
  cartId: string;
  cartRestoreLines: CartRestoreLine[];
}): Promise<{ ok: true; session: BtcpayCheckoutSession } | { ok: false; error: string }> {
  const inv = await btcpayCreateInvoice({
    amountUsd: params.totalCents / 100,
    orderNumber: params.orderNumber,
    redirectUrl: params.returnUrl,
    buyerEmail: params.email,
  });
  if (!inv.success) {
    await restoreCartIfEmpty(params.cartId, params.cartRestoreLines);
    return {
      ok: false,
      error: `${inv.error.startsWith("BTCPay") ? inv.error : `BTCPay: ${inv.error}`} Order ${params.orderNumber} was created; contact support or retry from your orders list.`,
    };
  }
  const btcpayUrl = getBtcpayPublicUrl();
  if (!btcpayUrl) {
    await restoreCartIfEmpty(params.cartId, params.cartRestoreLines);
    return { ok: false, error: "BTCPay public URL is not configured." };
  }
  const pay = await prisma.payment.create({
    data: {
      orderId: params.orderId,
      method: PaymentMethod.CRYPTO,
      status: PaymentStatus.PENDING,
      idempotencyKey: `btcpay_init_${params.orderNumber}`,
      amountCents: params.totalCents,
      provider: "btcpay",
      externalId: inv.invoice.id,
      payAddress: inv.invoice.checkoutLink,
      payAmountCrypto: "Bitcoin / Lightning (BTCPay)",
      asset: CryptoAsset.BTC,
    },
  });
  await prisma.paymentEvent.create({
    data: {
      paymentId: pay.id,
      type: "BTCPAY_INVOICE_CREATED",
      idempotencyKey: `btcpay_evt_${params.orderNumber}`,
      payload: { checkoutLink: inv.invoice.checkoutLink, returnUrl: params.returnUrl },
    },
  });
  await clearCheckoutCart(params.cartId);
  return {
    ok: true,
    session: {
      invoiceId: inv.invoice.id,
      checkoutLink: inv.invoice.checkoutLink,
      orderNumber: params.orderNumber,
      confirmationUrl: params.returnUrl,
      btcpayUrl,
    },
  };
}

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
