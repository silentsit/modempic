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

/** Count promo usage only once, when the order first becomes completed. */
export function shouldIncrementCouponRedemption(
  nextStatus: OrderStatus,
  existingCompletedAt: Date | null | undefined,
  couponId: string | null | undefined,
): couponId is string {
  return nextStatus === OrderStatus.COMPLETED && !existingCompletedAt && Boolean(couponId);
}

export function orderPaymentCompletionPlan(existingCompletedAt: Date | null | undefined, couponId: string | null | undefined) {
  const shouldIncrementCoupon = shouldIncrementCouponRedemption(OrderStatus.COMPLETED, existingCompletedAt, couponId);
  return {
    orderData: orderStatusWriteData(OrderStatus.COMPLETED, existingCompletedAt),
    shouldIncrementCoupon,
    couponId: shouldIncrementCoupon ? couponId : null,
    shouldSendPaidEmail: !existingCompletedAt,
  };
}
