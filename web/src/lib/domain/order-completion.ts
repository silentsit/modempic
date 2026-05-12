import { OrderStatus, type Prisma } from "@prisma/client";

/** Merge into `prisma.order.update({ data })` whenever order status moves to COMPLETED. */
export function orderStatusWriteData(
  nextStatus: OrderStatus,
  existingCompletedAt: Date | null | undefined,
): Prisma.OrderUpdateInput {
  const data: Prisma.OrderUpdateInput = { status: nextStatus };
  if (nextStatus === OrderStatus.COMPLETED && !existingCompletedAt) {
    data.completedAt = new Date();
  }
  return data;
}
