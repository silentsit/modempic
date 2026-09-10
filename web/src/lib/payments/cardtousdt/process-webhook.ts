import { createHash } from "node:crypto";
import { OrderStatus as DbOrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendOrderPaidEmail } from "@/lib/email/send";
import { cardToUsdtFulfillBand, cardToUsdtOurWebhookSecret } from "./config";
import { cardToUsdtPaidUsd, meetsCardToUsdtFulfillBand } from "./amount";
import { verifyCardToUsdtSignature } from "./signature";
import { parseCardToUsdtWebhookNotice } from "./notice";
import { CARDTOUSDT_PROVIDER, CARDTOUSDT_TIMESTAMP_WINDOW_SECONDS, type CardToUsdtCheckoutMeta } from "./types";

export type CardToUsdtWebhookHttpResult = { status: 200 } | { status: 400 | 403; message: string };

export { parseCardToUsdtWebhookNotice };

function asCheckoutMeta(payload: Prisma.JsonValue | null | undefined): CardToUsdtCheckoutMeta | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const amountUsd = Number((payload as { amountUsd?: unknown }).amountUsd);
  if (!Number.isFinite(amountUsd)) return null;
  const webhookSecretRaw = (payload as { webhookSecret?: unknown }).webhookSecret;
  return {
    amountUsd,
    amount: Number((payload as { amount?: unknown }).amount) || amountUsd,
    currency: String((payload as { currency?: unknown }).currency ?? "USD"),
    webhookSecret: typeof webhookSecretRaw === "string" && webhookSecretRaw ? webhookSecretRaw : null,
    depositAddress:
      typeof (payload as { depositAddress?: unknown }).depositAddress === "string"
        ? ((payload as { depositAddress: string }).depositAddress ?? null)
        : null,
    requestId:
      typeof (payload as { requestId?: unknown }).requestId === "string"
        ? ((payload as { requestId: string }).requestId ?? null)
        : null,
    checkoutUrl: String((payload as { checkoutUrl?: unknown }).checkoutUrl ?? ""),
    createdAt: String((payload as { createdAt?: unknown }).createdAt ?? ""),
  };
}

function txidHash(txidOut: string) {
  return createHash("sha256").update(`cardtousdt:${txidOut}`, "utf8").digest("hex");
}

async function markProcessed(bodyHash: string, error?: string | null) {
  await prisma.webhookEvent.updateMany({
    where: { provider: CARDTOUSDT_PROVIDER, bodyHash },
    data: { processed: true, ...(error != null ? { error } : {}) },
  });
}

async function ensureWebhookRow(bodyHash: string, signatureOk: boolean) {
  const existing = await prisma.webhookEvent.findFirst({
    where: { provider: CARDTOUSDT_PROVIDER, bodyHash },
  });
  if (existing) return existing;
  return prisma.webhookEvent.create({
    data: { provider: CARDTOUSDT_PROVIDER, bodyHash, signatureOk, processed: false },
  });
}

export async function processCardToUsdtWebhook(req: Request): Promise<CardToUsdtWebhookHttpResult> {
  const url = new URL(req.url);
  const notice = parseCardToUsdtWebhookNotice(url, req.headers);

  if (!notice.txidOut || !notice.valueCoin || !notice.coin) {
    return { status: 400, message: "missing settlement fields" };
  }
  if (!notice.orderId) {
    return { status: 400, message: "missing order_id" };
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: notice.orderId },
    include: {
      payments: {
        where: { provider: CARDTOUSDT_PROVIDER },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const payment = order?.payments[0] ?? null;
  const createdEvent = payment
    ? await prisma.paymentEvent.findUnique({
        where: { idempotencyKey: `cardtousdt_evt_${notice.orderId}` },
      })
    : null;
  const meta = asCheckoutMeta(createdEvent?.payload);

  const storedSecret = meta?.webhookSecret ?? null;
  if (storedSecret) {
    const ok = verifyCardToUsdtSignature({
      webhookSecret: storedSecret,
      timestamp: notice.timestamp,
      signature: notice.signature,
      txidOut: notice.txidOut,
      valueCoin: notice.valueCoin,
      coin: notice.coin,
    });
    if (!ok) {
      return {
        status: notice.timestamp === "" || notice.signature === "" ? 400 : 403,
        message: "invalid signature",
      };
    }
  } else if (notice.secret !== cardToUsdtOurWebhookSecret(notice.orderId)) {
    return { status: 403, message: "invalid webhook secret" };
  }

  const bodyHash = txidHash(notice.txidOut);
  const already = await prisma.webhookEvent.findFirst({
    where: { provider: CARDTOUSDT_PROVIDER, bodyHash, processed: true },
  });
  if (already) {
    return { status: 200 };
  }
  await ensureWebhookRow(bodyHash, true);

  if (!order || !payment) {
    await markProcessed(bodyHash, order ? "payment not found" : `order not found: ${notice.orderId}`);
    return { status: 200 };
  }

  try {
    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        type: "CARDTOUSDT_SETTLEMENT",
        idempotencyKey: `cardtousdt:txid:${notice.txidOut}`,
        payload: {
          txidOut: notice.txidOut,
          valueCoin: notice.valueCoin,
          coin: notice.coin,
          timestamp: notice.timestamp,
        },
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    // Duplicate txid_out event — keep going so a crash after insert can still fulfil.
  }

  if (storedSecret && notice.timestamp) {
    const age = Math.abs(Math.floor(Date.now() / 1000) - Number(notice.timestamp));
    if (!Number.isFinite(age) || age > CARDTOUSDT_TIMESTAMP_WINDOW_SECONDS) {
      await holdForReview(payment.id, notice.txidOut, "stale_timestamp", {
        txidOut: notice.txidOut,
        timestamp: notice.timestamp,
      });
      await markProcessed(bodyHash, "stale_timestamp");
      return { status: 200 };
    }
  }

  if (order.status === DbOrderStatus.COMPLETED || payment.status === PaymentStatus.SUCCEEDED) {
    await markProcessed(bodyHash);
    return { status: 200 };
  }

  const expectedUsd = meta?.amountUsd;
  if (expectedUsd == null) {
    await holdForReview(payment.id, notice.txidOut, "missing_amount_usd", { txidOut: notice.txidOut });
    await markProcessed(bodyHash, "missing_amount_usd");
    return { status: 200 };
  }

  const paidUsd = await cardToUsdtPaidUsd(notice.valueCoin, notice.coin);
  const band = cardToUsdtFulfillBand();
  if (paidUsd == null || !meetsCardToUsdtFulfillBand(paidUsd, expectedUsd, band)) {
    await holdForReview(payment.id, notice.txidOut, "below_band_or_unpriced", {
      txidOut: notice.txidOut,
      valueCoin: notice.valueCoin,
      coin: notice.coin,
      paidUsd,
      expectedUsd,
      band,
    });
    await markProcessed(bodyHash, "below_band_or_unpriced");
    return { status: 200 };
  }

  const completion = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        externalId: notice.txidOut,
        failureReason: null,
        payAmountCrypto: `${notice.valueCoin} ${notice.coin}`,
      },
    });
    const firstOrderCompletion = await tx.order.updateMany({
      where: { id: order.id, completedAt: null },
      data: { status: DbOrderStatus.COMPLETED, completedAt: new Date() },
    });
    if (firstOrderCompletion.count === 0) {
      await tx.order.update({ where: { id: order.id }, data: { status: DbOrderStatus.COMPLETED } });
    }
    await tx.webhookEvent.updateMany({
      where: { provider: CARDTOUSDT_PROVIDER, bodyHash },
      data: { processed: true, error: null },
    });
    if (firstOrderCompletion.count > 0 && order.couponId) {
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { redemptionCount: { increment: 1 } },
      });
    }
    return { shouldSendPaidEmail: firstOrderCompletion.count > 0 };
  });

  if (completion.shouldSendPaidEmail) {
    const paidUser = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } });
    if (paidUser?.email) {
      await sendOrderPaidEmail(paidUser.email, order.orderNumber);
    }
    const { onOrderPaymentSucceeded } = await import("@/lib/email/funnels/order-payment");
    void onOrderPaymentSucceeded(order.id).catch((err) =>
      console.error("[funnel] cancel unpaid failed", err),
    );
  }

  return { status: 200 };
}

async function holdForReview(
  paymentId: string,
  txidOut: string,
  reason: string,
  payload: Prisma.JsonObject,
) {
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.REQUIRES_ACTION, failureReason: `CardToUSDT hold: ${reason}` },
  });
  try {
    await prisma.paymentEvent.create({
      data: {
        paymentId,
        type: "CARDTOUSDT_HOLD",
        idempotencyKey: `cardtousdt:hold:${txidOut}:${reason}`,
        payload,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    // Duplicate hold.
  }
}
