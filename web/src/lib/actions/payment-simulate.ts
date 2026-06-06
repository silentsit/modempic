"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { isSimProvider } from "@/lib/payments/crypto-simulate";
import { sendOrderPaidEmail } from "@/lib/email/send";

export async function simulatePaymentCompleteAction(formData: FormData): Promise<void> {
  if (process.env.NODE_ENV === "production" && process.env.DEV_PAYMENT_SIMULATE !== "1") {
    return;
  }
  const orderNumber = String(formData.get("orderNumber") ?? "");
  if (!orderNumber) return;
  const session = await auth();
  if (!session?.user?.id) return;
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: session.user.id },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) return;
  const pay = order.payments[0];
  if (!pay || !isSimProvider(pay.provider)) {
    return;
  }
  if (pay.status === PaymentStatus.SUCCEEDED) {
    revalidatePath(`/order/${orderNumber}/confirmation`);
    return;
  }
  const idem = `sim_conf_${pay.id}`;
  const completion = await prisma.$transaction(async (tx) => {
    const paymentUpdate = await tx.payment.updateMany({
      where: { id: pay.id, status: { not: PaymentStatus.SUCCEEDED } },
      data: { status: PaymentStatus.SUCCEEDED },
    });
    if (paymentUpdate.count === 0) {
      return { shouldSendPaidEmail: false };
    }

    const firstOrderCompletion = await tx.order.updateMany({
      where: { id: order.id, completedAt: null },
      data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
    });
    if (firstOrderCompletion.count === 0) {
      await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.COMPLETED } });
    }

    await tx.paymentEvent.upsert({
      where: { idempotencyKey: idem },
      update: {},
      create: { paymentId: pay.id, type: "SUCCEEDED", idempotencyKey: idem, payload: { simulated: true } },
    });

    if (firstOrderCompletion.count > 0 && order.couponId) {
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { redemptionCount: { increment: 1 } },
      });
    }

    return { shouldSendPaidEmail: firstOrderCompletion.count > 0 };
  });
  if (completion.shouldSendPaidEmail && session.user.email) {
    await sendOrderPaidEmail(session.user.email, orderNumber);
    const { onOrderPaymentSucceeded } = await import("@/lib/email/funnels/order-payment");
    void onOrderPaymentSucceeded(order.id).catch((err) =>
      console.error("[funnel] cancel unpaid failed", err),
    );
  }
  revalidatePath(`/order/${orderNumber}/confirmation`);
  revalidatePath("/admin");
}
