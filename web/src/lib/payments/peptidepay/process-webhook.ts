import { createHash } from "node:crypto";
import { OrderStatus as DbOrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendOrderPaidEmail } from "@/lib/email/send";
import { peptidePayGetSession } from "./client";

export type PeptidePayWebhookPayload = {
  event?: string;
  session_id?: string;
  order_id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  txid?: string;
  paid_at?: string;
  attempt?: number;
};

async function findOrderForWebhook(payload: PeptidePayWebhookPayload) {
  const orderNumber = payload.order_id;
  if (orderNumber) {
    const byNumber = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        payments: { where: { provider: "peptidepay" }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (byNumber) return byNumber;
  }

  const sessionId = payload.session_id;
  if (!sessionId) return null;
  const payment = await prisma.payment.findFirst({
    where: { provider: "peptidepay", externalId: sessionId },
    include: {
      order: {
        include: { payments: { where: { provider: "peptidepay" }, orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
  return payment?.order ?? null;
}

export async function processPeptidePayWebhook(
  rawBody: string,
  payload: PeptidePayWebhookPayload,
): Promise<{ status: 200 } | { status: 400; message: string }> {
  if (payload.event === "webhook.test") {
    return { status: 200 };
  }

  const bodyHash = createHash("sha256").update(rawBody, "utf8").digest("hex");

  const already = await prisma.webhookEvent.findFirst({
    where: { provider: "peptidepay", bodyHash, processed: true },
  });
  if (already) return { status: 200 };

  const pending = await prisma.webhookEvent.findFirst({
    where: { provider: "peptidepay", bodyHash, processed: false },
  });
  if (!pending) {
    await prisma.webhookEvent.create({
      data: { provider: "peptidepay", bodyHash, signatureOk: true, processed: false },
    });
  }

  const order = await findOrderForWebhook(payload);
  if (!order) {
    await markProcessed(bodyHash, "order not found: " + (payload.order_id ?? payload.session_id ?? "?"));
    return { status: 200 };
  }

  const payment =
    order.payments[0] ??
    (await prisma.payment.findFirst({
      where: { orderId: order.id, provider: "peptidepay" },
      orderBy: { createdAt: "desc" },
    }));

  if (!payment) {
    await markProcessed(bodyHash, "payment not found for order " + order.id);
    return { status: 200 };
  }

  const deliveryKey = payload.session_id ?? bodyHash;
  try {
    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        type: `peptidepay.${payload.event ?? payload.status ?? "event"}`,
        idempotencyKey: `peptidepay:${deliveryKey}:${payload.attempt ?? 1}`,
        payload: JSON.parse(JSON.stringify(payload)) as Prisma.JsonObject,
      },
    });
  } catch {
    // duplicate delivery
  }

  if (order.status === DbOrderStatus.COMPLETED) {
    await markProcessed(bodyHash);
    return { status: 200 };
  }

  if (payload.event !== "order.paid" && payload.status !== "paid") {
    await markProcessed(bodyHash);
    return { status: 200 };
  }

  if (payload.session_id) {
    const verify = await peptidePayGetSession(payload.session_id);
    if (!verify.ok || verify.status !== "paid") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REQUIRES_ACTION, failureReason: "PeptidePay session verify did not confirm paid" },
      });
      await markProcessed(bodyHash, "session verify failed");
      return { status: 200 };
    }
    if (verify.orderId != null && String(verify.orderId) !== String(order.orderNumber)) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REQUIRES_ACTION, failureReason: "PeptidePay session order_id mismatch" },
      });
      await markProcessed(bodyHash, "order_id mismatch");
      return { status: 200 };
    }
  }

  const completion = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        externalId: payload.session_id ?? payment.externalId,
        payAmountCrypto: payload.txid ?? payment.payAmountCrypto,
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
      where: { provider: "peptidepay", bodyHash },
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

async function markProcessed(bodyHash: string, error?: string | null) {
  await prisma.webhookEvent.updateMany({
    where: { provider: "peptidepay", bodyHash },
    data: { processed: true, ...(error != null ? { error } : {}) },
  });
}
