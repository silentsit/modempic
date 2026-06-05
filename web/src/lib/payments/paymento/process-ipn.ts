import { createHash } from "node:crypto";
import { OrderStatus as DbOrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { paymentoVerifyToken } from "./client";
import { sendOrderPaidEmail } from "@/lib/email/send";
import { orderStatusWriteData, shouldIncrementCouponRedemption } from "@/lib/domain/order-completion";

export type PaymentoIpnPayload = {
  Token: string;
  PaymentId: number;
  OrderId: string;
  OrderStatus: number;
  AdditionalData?: unknown;
};

/**
 * IPN from Paymento after HMAC verification. Fulfills only when OrderStatus === 7 and verify API succeeds.
 */
export async function processPaymentoIpn(
  rawBody: string,
  payload: PaymentoIpnPayload,
): Promise<{ status: 200 } | { status: 400; message: string }> {
  const bodyHash = createHash("sha256").update(rawBody, "utf8").digest("hex");

  const already = await prisma.webhookEvent.findFirst({
    where: { provider: "paymento", bodyHash, processed: true },
  });
  if (already) {
    return { status: 200 };
  }

  const pending = await prisma.webhookEvent.findFirst({
    where: { provider: "paymento", bodyHash, processed: false },
  });
  if (!pending) {
    await prisma.webhookEvent.create({
      data: { provider: "paymento", bodyHash, signatureOk: true, processed: false },
    });
  }

  const { Token, OrderId, OrderStatus: ipnStatus, PaymentId } = payload;

  const order = await prisma.order.findUnique({
    where: { orderNumber: OrderId },
    include: {
      payments: { where: { provider: "paymento" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!order) {
    await finishWebhookError(bodyHash, "order not found: " + OrderId);
    return { status: 200 };
  }

  const payment =
    order.payments[0] ??
    (await prisma.payment.findFirst({
      where: { orderId: order.id, provider: "paymento" },
      orderBy: { createdAt: "desc" },
    }));

  if (!payment) {
    await finishWebhookError(bodyHash, "payment not found for order " + order.id);
    return { status: 200 };
  }

  const idempotencyKey = `paymento:ipn:${PaymentId}:${ipnStatus}`;
  try {
    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        type: `paymento.status.${ipnStatus}`,
        idempotencyKey,
        payload: JSON.parse(JSON.stringify(payload)) as Prisma.JsonObject,
      },
    });
  } catch {
    // duplicate idempotency key
  }

  if (order.status === DbOrderStatus.COMPLETED) {
    await markProcessed(bodyHash);
    return { status: 200 };
  }

  if (ipnStatus === 7) {
    const verify = await paymentoVerifyToken(Token);
    if (!verify.ok) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REQUIRES_ACTION, failureReason: "Paymento verify API did not confirm" },
      });
      await markProcessed(bodyHash, "verify failed");
      return { status: 200 };
    }
    if (verify.orderId != null && String(verify.orderId) !== String(OrderId)) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REQUIRES_ACTION, failureReason: "Paymento verify orderId mismatch" },
      });
      await markProcessed(bodyHash, "orderId mismatch");
      return { status: 200 };
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.SUCCEEDED, externalId: Token },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: orderStatusWriteData(DbOrderStatus.COMPLETED, order.completedAt),
      }),
      prisma.webhookEvent.updateMany({
        where: { provider: "paymento", bodyHash },
        data: { processed: true, error: null },
      }),
      ...(shouldIncrementCouponRedemption(DbOrderStatus.COMPLETED, order.completedAt, order.couponId)
        ? [
            prisma.coupon.update({
              where: { id: order.couponId },
              data: { redemptionCount: { increment: 1 } },
            }),
          ]
        : []),
    ]);

    const paidUser = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } });
    if (paidUser?.email) {
      await sendOrderPaidEmail(paidUser.email, order.orderNumber);
    }

    return { status: 200 };
  }

  if (ipnStatus === 4) {
    await terminalFailure(
      order.id,
      payment.id,
      PaymentStatus.EXPIRED,
      DbOrderStatus.FAILED,
      "Paymento timeout",
    );
    await markProcessed(bodyHash);
    return { status: 200 };
  }

  if (ipnStatus === 5 || ipnStatus === 9) {
    await terminalFailure(
      order.id,
      payment.id,
      PaymentStatus.FAILED,
      DbOrderStatus.FAILED,
      `Paymento status ${ipnStatus}`,
    );
    await markProcessed(bodyHash);
    return { status: 200 };
  }

  await markProcessed(bodyHash);
  return { status: 200 };
}

async function terminalFailure(
  orderId: string,
  paymentId: string,
  paymentStatus: PaymentStatus,
  orderStatus: DbOrderStatus,
  reason: string,
) {
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: { status: paymentStatus, failureReason: reason },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: orderStatus },
    }),
  ]);
}

async function markProcessed(bodyHash: string, error?: string | null) {
  await prisma.webhookEvent.updateMany({
    where: { provider: "paymento", bodyHash },
    data: { processed: true, ...(error != null ? { error } : {}) },
  });
}

async function finishWebhookError(bodyHash: string, err: string) {
  await prisma.webhookEvent.updateMany({
    where: { provider: "paymento", bodyHash },
    data: { processed: true, error: err },
  });
}
