import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { sendAdminNewOrderEmail, sendOrderPaidEmail } from "@/lib/email/send";
import { orderPayloadFromDb } from "@/lib/email/order-payload";
import { onOrderPaymentSucceeded } from "@/lib/email/funnels/order-payment";
import { ORGANIZATION_SUPPORT_EMAIL } from "@/lib/seo/page-json-ld";

function adminOrderInbox(): string {
  return env.ADMIN_ORDER_NOTIFICATION_EMAIL ?? ORGANIZATION_SUPPORT_EMAIL;
}

/** Customer + staff order confirmation after CardToUSDT / Paymento payment succeeds. */
export async function sendOrderPaymentSucceededNotifications(args: {
  orderId: string;
  orderNumber: string;
  userId: string;
}): Promise<void> {
  const { orderId, orderNumber, userId } = args;
  try {
    const [paidUser, order] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
      prisma.order.findUnique({
        where: { orderNumber },
        include: {
          lines: true,
          shippingAddress: true,
          billingAddress: true,
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
          user: { select: { name: true } },
        },
      }),
    ]);

    if (paidUser?.email) {
      await sendOrderPaidEmail(paidUser.email, orderNumber);
    }

    if (order) {
      await sendAdminNewOrderEmail(adminOrderInbox(), orderPayloadFromDb(order));
    }
  } catch (err) {
    console.error("[EMAIL] order payment notifications failed", orderNumber, err);
  }

  try {
    await onOrderPaymentSucceeded(orderId);
  } catch (err) {
    console.error("[EMAIL] unpaid-order funnel cancel failed", orderNumber, err);
  }
}
