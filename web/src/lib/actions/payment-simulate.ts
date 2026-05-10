"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { createHash } from "node:crypto";
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
  const idem = `sim_conf_${createHash("sha256").update(`${pay.id}-${Date.now()}`).digest("hex").slice(0, 24)}`;
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: pay.id },
      data: { status: PaymentStatus.SUCCEEDED },
    }),
    prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.COMPLETED } }),
    prisma.paymentEvent.create({
      data: { paymentId: pay.id, type: "SUCCEEDED", idempotencyKey: idem, payload: { simulated: true } },
    }),
  ]);
  if (session.user.email) {
    await sendOrderPaidEmail(session.user.email, orderNumber);
  }
  revalidatePath(`/order/${orderNumber}/confirmation`);
  revalidatePath("/admin");
}
