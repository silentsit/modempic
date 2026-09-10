import { randomUUID } from "node:crypto";
import { CryptoAsset, PaymentMethod, PaymentStatus, type Payment } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  paymentoCreatePaymentRequest,
  paymentoGatewayUrl,
  getPaymentoSpeedFromEnv,
} from "@/lib/payments/paymento";
import {
  buildCardToUsdtWebhookUrl,
  cardToUsdtCreateCheckout,
  cardToUsdtPayoutAddress,
  CARDTOUSDT_PROVIDER,
  cardToUsdtChargeAmount,
} from "@/lib/payments/cardtousdt";
import { clearMatchingCheckoutCartLines, restoreCartIfEmpty } from "@/lib/checkout/checkout-cart";

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
  await clearMatchingCheckoutCartLines(params.cartId, params.cartRestoreLines);
  return { ok: true, gatewayUrl: gateway };
}

export async function createCardToUsdtCheckoutSession(params: {
  orderId: string;
  orderNumber: string;
  totalCents: number;
  buyerEmail: string;
  cartId: string;
  cartRestoreLines: CartRestoreLine[];
}): Promise<{ ok: true; gatewayUrl: string } | { ok: false; error: string }> {
  const existing = await latestPayment(params.orderId, CARDTOUSDT_PROVIDER);
  if (existing?.status === PaymentStatus.SUCCEEDED) {
    return { ok: false, error: `Order ${params.orderNumber} is already paid.` };
  }
  const reused = reusableGatewayFromPayment(existing);
  if (reused) return { ok: true, gatewayUrl: reused };

  const buyerEmail = params.buyerEmail.trim();
  if (!buyerEmail || buyerEmail.length > 254) {
    await restoreCartIfEmpty(params.cartId, params.cartRestoreLines);
    return { ok: false, error: `Card checkout needs a valid email on the order. Order ${params.orderNumber} was created.` };
  }

  const payoutAddress = cardToUsdtPayoutAddress();
  const webhookUrl = buildCardToUsdtWebhookUrl(params.orderNumber);
  if (!payoutAddress || !webhookUrl) {
    await restoreCartIfEmpty(params.cartId, params.cartRestoreLines);
    return { ok: false, error: `Card checkout is not configured. Order ${params.orderNumber} was created.` };
  }
  if (!existing) {
    await restoreCartIfEmpty(params.cartId, params.cartRestoreLines);
    return { ok: false, error: `Order ${params.orderNumber} has no card payment record. Contact support.` };
  }

  // Every provider POST can mint a live payment. Claim the payment row first so
  // two tabs cannot create two CardToUSDT checkouts for the same order.
  const mintClaim = `cardtousdt_minting:${randomUUID()}`;
  const claimed = await prisma.payment.updateMany({
    where: {
      id: existing.id,
      status: PaymentStatus.PENDING,
      payAddress: null,
      externalId: null,
    },
    data: { externalId: mintClaim, failureReason: null },
  });
  if (claimed.count === 0) {
    const current = await prisma.payment.findUnique({ where: { id: existing.id } });
    const currentUrl = reusableGatewayFromPayment(current);
    if (currentUrl) return { ok: true, gatewayUrl: currentUrl };
    await restoreCartIfEmpty(params.cartId, params.cartRestoreLines);
    return {
      ok: false,
      error:
        current?.status === PaymentStatus.REQUIRES_ACTION
          ? `Card checkout for order ${params.orderNumber} needs support review before retrying.`
          : `Card checkout for order ${params.orderNumber} is already being prepared. Wait a moment and try again.`,
    };
  }

  const chargeAmount = cardToUsdtChargeAmount(params.totalCents);
  const createInput = {
    payoutAddress,
    amount: chargeAmount,
    currency: "USD" as const,
    buyerEmail,
    orderId: params.orderNumber.trim().toUpperCase(),
    webhookUrl,
  };
  let created = await cardToUsdtCreateCheckout(createInput);
  if (!created.ok && created.retryable) {
    created = await cardToUsdtCreateCheckout(createInput);
  }
  if (!created.ok) {
    const requiresReview =
      created.code === "network_error" || created.code === "ambiguous_response";
    if (requiresReview) {
      await prisma.payment.updateMany({
        where: { id: existing.id, externalId: mintClaim, payAddress: null },
        data: {
          status: PaymentStatus.REQUIRES_ACTION,
          failureReason:
            "CardToUSDT create result was ambiguous; verify with the provider before creating another checkout.",
        },
      });
    } else {
      await prisma.payment.updateMany({
        where: { id: existing.id, externalId: mintClaim, payAddress: null },
        data: { externalId: null, failureReason: `CardToUSDT: ${created.error}` },
      });
    }
    await restoreCartIfEmpty(params.cartId, params.cartRestoreLines);
    return {
      ok: false,
      error:
        requiresReview
          ? `CardToUSDT: ${created.error}. Order ${params.orderNumber} needs support review before another checkout is created.`
          : `CardToUSDT: ${created.error}. Order ${params.orderNumber} was created; contact support or retry from your orders list.`,
    };
  }

  return persistCardToUsdtCheckout(params, existing, created, mintClaim);
}

async function persistCardToUsdtCheckout(
  params: {
    orderId: string;
    orderNumber: string;
    totalCents: number;
    cartId: string;
    cartRestoreLines: CartRestoreLine[];
  },
  existing: Payment,
  created: {
    checkoutUrl: string;
    depositAddress: string | null;
    amount: number;
    currency: string;
    amountUsd: number;
    webhookSecret: string | null;
    createdAt: string;
    requestId: string | null;
  },
  mintClaim: string,
): Promise<{ ok: true; gatewayUrl: string }> {
  const payData = {
    method: PaymentMethod.CARD_ONRAMP,
    status: PaymentStatus.PENDING,
    amountCents: params.totalCents,
    provider: CARDTOUSDT_PROVIDER,
    externalId: created.depositAddress ?? created.requestId,
    payAddress: created.checkoutUrl,
    payAmountCrypto: `CardToUSDT ${created.amountUsd} USD`,
    asset: null,
    failureReason: null,
  };
  const eventPayload = {
    amountUsd: created.amountUsd,
    amount: created.amount,
    currency: created.currency,
    webhookSecret: created.webhookSecret,
    depositAddress: created.depositAddress,
    requestId: created.requestId,
    checkoutUrl: created.checkoutUrl,
    createdAt: created.createdAt,
  };
  await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { id: existing.id, externalId: mintClaim, payAddress: null },
      data: payData,
    });
    if (updated.count !== 1) {
      throw new Error(`CardToUSDT payment claim was lost for order ${params.orderNumber}`);
    }
    // Never overwrite checkout metadata: an older hosted URL can remain
    // payable and its webhook_secret must continue to verify.
    await tx.paymentEvent.create({
      data: {
        paymentId: existing.id,
        type: "CARDTOUSDT_CHECKOUT_CREATED",
        idempotencyKey: `cardtousdt_evt_${params.orderNumber}`,
        payload: eventPayload,
      },
    });
  });
  await clearMatchingCheckoutCartLines(params.cartId, params.cartRestoreLines);
  return { ok: true, gatewayUrl: created.checkoutUrl };
}
