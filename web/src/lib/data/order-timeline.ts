import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type OrderTimelineCategory = "order" | "payment" | "email" | "admin";

export type OrderTimelineEntry = {
  id: string;
  at: Date;
  category: OrderTimelineCategory;
  title: string;
  detail?: string;
  meta?: Record<string, unknown>;
};

function formatStatusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function orderLifecycleEntries(order: {
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  status: OrderStatus;
}): OrderTimelineEntry[] {
  const entries: OrderTimelineEntry[] = [
    {
      id: "order-created",
      at: order.createdAt,
      category: "order",
      title: "Order created",
      detail: "Checkout submitted and order record created.",
    },
  ];

  if (order.completedAt) {
    entries.push({
      id: "order-completed",
      at: order.completedAt,
      category: "order",
      title: "Payment completed",
      detail: `Order marked ${formatStatusLabel(OrderStatus.COMPLETED)}.`,
    });
  } else if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.FAILED) {
    entries.push({
      id: `order-${order.status.toLowerCase()}`,
      at: order.updatedAt,
      category: "order",
      title: `Order ${formatStatusLabel(order.status)}`,
    });
  }

  return entries;
}

function paymentEntries(
  payments: {
    id: string;
    provider: string;
    method: string;
    status: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
    events: { id: string; type: string; createdAt: Date; idempotencyKey: string | null; payload: unknown }[];
  }[],
): OrderTimelineEntry[] {
  const entries: OrderTimelineEntry[] = [];

  for (const payment of payments) {
    entries.push({
      id: `payment-${payment.id}`,
      at: payment.createdAt,
      category: "payment",
      title: "Payment session created",
      detail: `${payment.provider} · ${formatStatusLabel(payment.method)} · ${formatStatusLabel(payment.status)}`,
      meta: { paymentId: payment.id, provider: payment.provider },
    });

    for (const event of payment.events) {
      entries.push({
        id: `payment-event-${event.id}`,
        at: event.createdAt,
        category: "payment",
        title: formatStatusLabel(event.type),
        detail: event.idempotencyKey ? `Idempotency: ${event.idempotencyKey}` : undefined,
        meta: { paymentId: payment.id, payload: event.payload },
      });
    }

    if (payment.status === PaymentStatus.SUCCEEDED && payment.updatedAt > payment.createdAt) {
      const hasSucceededEvent = payment.events.some((e) => /succeed/i.test(e.type));
      if (!hasSucceededEvent) {
        entries.push({
          id: `payment-succeeded-${payment.id}`,
          at: payment.updatedAt,
          category: "payment",
          title: "Payment succeeded",
          detail: `${payment.provider} reported a successful payment.`,
          meta: { paymentId: payment.id },
        });
      }
    }
  }

  return entries;
}

function emailEntries(
  logs: { id: string; to: string; subject: string; template: string; status: string; error: string | null; createdAt: Date }[],
): OrderTimelineEntry[] {
  return logs.map((log) => ({
    id: `email-${log.id}`,
    at: log.createdAt,
    category: "email",
    title: log.status === "failed" ? "Email failed" : "Email sent",
    detail: `${log.template} → ${log.to}: ${log.subject}`,
    meta: log.error ? { error: log.error } : undefined,
  }));
}

function adminAuditEntries(
  logs: { id: string; action: string; summary: string; actorEmail: string | null; createdAt: Date; changes: unknown }[],
): OrderTimelineEntry[] {
  return logs.map((log) => ({
    id: `audit-${log.id}`,
    at: log.createdAt,
    category: "admin",
    title: formatStatusLabel(log.action),
    detail: log.summary,
    meta: {
      actorEmail: log.actorEmail ?? undefined,
      changes: log.changes,
    },
  }));
}

export async function loadOrderTimeline(orderId: string, orderNumber: string): Promise<OrderTimelineEntry[]> {
  const [order, payments, emailLogs, auditLogs] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      select: { createdAt: true, updatedAt: true, completedAt: true, status: true },
    }),
    prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
      include: { events: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.emailLog.findMany({
      where: { subject: { contains: orderNumber } },
      orderBy: { createdAt: "asc" },
      take: 40,
    }),
    prisma.adminAuditLog.findMany({
      where: { entityType: "order", entityId: orderId },
      orderBy: { createdAt: "asc" },
      take: 40,
    }),
  ]);

  if (!order) return [];

  const entries = [
    ...orderLifecycleEntries(order),
    ...paymentEntries(payments),
    ...emailEntries(emailLogs),
    ...adminAuditEntries(auditLogs),
  ];

  return entries.sort((a, b) => a.at.getTime() - b.at.getTime() || a.id.localeCompare(b.id));
}
