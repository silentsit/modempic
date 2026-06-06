import { OrderStatus, PaymentStatus } from "@prisma/client";

const DELETABLE_STATUSES = new Set<OrderStatus>([
  OrderStatus.DRAFT,
  OrderStatus.CANCELLED,
  OrderStatus.FAILED,
  OrderStatus.PENDING_PAYMENT,
]);

export type OrderDeleteCheckInput = {
  status: OrderStatus;
  completedAt: Date | null;
  payments: { status: PaymentStatus }[];
};

export function orderDeleteBlockedReason(order: OrderDeleteCheckInput): string | null {
  if (order.completedAt) {
    return "Orders that were completed cannot be deleted.";
  }
  if (!DELETABLE_STATUSES.has(order.status)) {
    return "Only draft, pending payment, cancelled, or failed orders can be deleted.";
  }
  const hasProtectedPayment = order.payments.some(
    (p) => p.status === PaymentStatus.SUCCEEDED || p.status === PaymentStatus.REFUNDED,
  );
  if (hasProtectedPayment) {
    return "Orders with successful or refunded payments cannot be deleted.";
  }
  return null;
}

export function isOrderDeletable(order: OrderDeleteCheckInput): boolean {
  return orderDeleteBlockedReason(order) === null;
}
