import { EmailFunnelType, OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function isWelcomeFunnelEligible(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, bannedAt: true },
  });
  return Boolean(user?.email && !user.bannedAt);
}

export async function isAbandonedCartFunnelEligible(referenceId: string): Promise<boolean> {
  const cart = await prisma.cart.findUnique({
    where: { id: referenceId },
    include: {
      items: { take: 1 },
      user: { select: { bannedAt: true, email: true } },
    },
  });
  if (!cart?.user.email || cart.user.bannedAt) return false;
  return cart.items.length > 0;
}

export async function isUnpaidOrderFunnelEligible(referenceId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: referenceId },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      user: { select: { bannedAt: true, email: true } },
    },
  });
  if (!order?.user.email || order.user.bannedAt) return false;
  if (order.status !== OrderStatus.PENDING_PAYMENT) return false;
  const latestPayment = order.payments[0];
  if (latestPayment?.status === PaymentStatus.SUCCEEDED) return false;
  return true;
}

export async function isFunnelEnrollmentEligible(
  funnelType: EmailFunnelType,
  referenceId: string,
): Promise<boolean> {
  switch (funnelType) {
    case "WELCOME_SIGNUP":
      return isWelcomeFunnelEligible(referenceId);
    case "ABANDONED_CART":
      return isAbandonedCartFunnelEligible(referenceId);
    case "UNPAID_ORDER":
      return isUnpaidOrderFunnelEligible(referenceId);
    default:
      return false;
  }
}
