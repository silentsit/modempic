import { cancelUnpaidOrderFunnel } from "@/lib/email/funnels/enroll";

/** Stop unpaid-order recovery drips once payment succeeds or the order is no longer collectible. */
export async function onOrderPaymentSucceeded(orderId: string) {
  await cancelUnpaidOrderFunnel(orderId);
}
