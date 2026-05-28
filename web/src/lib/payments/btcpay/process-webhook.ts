import { createHash } from "node:crypto";
import { OrderStatus as DbOrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { orderStatusWriteData } from "@/lib/domain/order-completion";
import { sendOrderPaidEmail } from "@/lib/email/send";

export type BtcpayWebhookPayload = {
  deliveryId?: string;
  webhookId?: string;
  type?: string;
  invoiceId?: string;
  metadata?: Record<string, string>;
  partiallyPaid?: boolean;
  overPaid?: boolean;
  afterExpiration?: boolean;
};

async function findOrderForWebhook(payload: BtcpayWebhookPayload) {
  const invoiceId = payload.invoiceId;
  if (!invoiceId) return null;

  const orderNumber = payload.metadata?.orderId;
  if (orderNumber) {
    const byMeta = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        payments: { where: { provider: "btcpay" }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (byMeta) return byMeta;
  }

  const payment = await prisma.payment.findFirst({
    where: { provider: "btcpay", externalId: invoiceId },
    include: { order: { include: { payments: { where: { provider: "btcpay" }, orderBy: { createdAt: "desc" }, take: 1 } } } },
  });
  return payment?.order ?? null;
}

export async function processBtcpayWebhook(
  rawBody: string,
  payload: BtcpayWebhookPayload,
): Promise<{ status: 200 } | { status: 400; message: string }> {
  const bodyHash = createHash("sha256").update(rawBody, "utf8").digest("hex");

  const already = await prisma.webhookEvent.findFirst({
    where: { provider: "btcpay", bodyHash, processed: true },
  });
  if (already) return { status: 200 };

  const pending = await prisma.webhookEvent.findFirst({
    where: { provider: "btcpay", bodyHash, processed: false },
  });
  if (!pending) {
    await prisma.webhookEvent.create({
      data: { provider: "btcpay", bodyHash, signatureOk: true, processed: false },
    });
  }

  const eventType = payload.type ?? "unknown";
  const deliveryKey = payload.deliveryId ?? bodyHash;

  const order = await findOrderForWebhook(payload);
  if (!order) {
    await markProcessed(bodyHash, "order not found for invoice " + (payload.invoiceId ?? "?"));
    return { status: 200 };
  }

  const payment =
    order.payments[0] ??
    (await prisma.payment.findFirst({
      where: { orderId: order.id, provider: "btcpay" },
      orderBy: { createdAt: "desc" },
    }));

  if (!payment) {
    await markProcessed(bodyHash, "payment not found for order " + order.id);
    return { status: 200 };
  }

  try {
    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        type: `btcpay.${eventType}`,
        idempotencyKey: `btcpay:${deliveryKey}`,
        payload: JSON.parse(JSON.stringify(payload)) as Prisma.JsonObject,
      },
    });
  } catch {
    // duplicate delivery
  }

  if (order.status === DbOrderStatus.COMPLETED && eventType !== "InvoiceExpired" && eventType !== "InvoiceInvalid") {
    await markProcessed(bodyHash);
    return { status: 200 };
  }

  switch (eventType) {
    case "InvoiceProcessing":
    case "InvoiceReceivedPayment":
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.SUCCEEDED, externalId: payload.invoiceId ?? payment.externalId },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { status: DbOrderStatus.PROCESSING },
        }),
      ]);
      break;

    case "InvoiceSettled":
    case "InvoicePaymentSettled": {
      const wasCompleted = order.status === DbOrderStatus.COMPLETED;
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.SUCCEEDED, externalId: payload.invoiceId ?? payment.externalId },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: orderStatusWriteData(DbOrderStatus.COMPLETED, order.completedAt),
        }),
        prisma.webhookEvent.updateMany({
          where: { provider: "btcpay", bodyHash },
          data: { processed: true, error: null },
        }),
      ]);
      if (!wasCompleted) {
        const paidUser = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } });
        if (paidUser?.email) {
          await sendOrderPaidEmail(paidUser.email, order.orderNumber);
        }
      }
      return { status: 200 };
    }

    case "InvoiceExpired":
      await terminalFailure(order.id, payment.id, PaymentStatus.EXPIRED, DbOrderStatus.FAILED, "BTCPay invoice expired");
      break;

    case "InvoiceInvalid":
      await terminalFailure(order.id, payment.id, PaymentStatus.FAILED, DbOrderStatus.FAILED, "BTCPay invoice invalid");
      break;

    default:
      break;
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
    where: { provider: "btcpay", bodyHash },
    data: { processed: true, ...(error != null ? { error } : {}) },
  });
}
