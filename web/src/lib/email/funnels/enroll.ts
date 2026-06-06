import { EmailFunnelStatus, EmailFunnelType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FUNNEL_STEP_DELAYS, hoursToMs } from "@/lib/email/funnels/definitions";
import { isWelcomeFunnelEligible } from "@/lib/email/funnels/eligibility";
import { sendFunnelStepEmail } from "@/lib/email/funnels/send-step";
import { advanceEnrollmentAfterSend, cancelFunnelEnrollment } from "@/lib/email/funnels/process";

async function cartSnapshot(cartId: string) {
  const lines = await prisma.cartLine.findMany({
    where: { cartId },
    include: { product: { select: { name: true } } },
  });
  const totalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const names = lines.map((l) => l.product.name).filter(Boolean);
  const cartSummary =
    names.length === 0
      ? ""
      : names.length <= 3
        ? names.join(", ")
        : `${names.slice(0, 3).join(", ")} + ${names.length - 3} more`;
  return { lineCount: lines.length, totalCents, cartSummary };
}

function firstNameFrom(name: string | null | undefined): string | undefined {
  const n = name?.trim();
  if (!n) return undefined;
  return n.split(/\s+/)[0];
}

/** Welcome drip — credentials signup and OAuth createUser. */
export async function enrollWelcomeSignupFunnel(params: {
  userId: string;
  email: string;
  name?: string | null;
}) {
  if (!(await isWelcomeFunnelEligible(params.userId))) return;

  const prior = await prisma.emailFunnelEnrollment.findUnique({
    where: {
      funnelType_referenceId: { funnelType: EmailFunnelType.WELCOME_SIGNUP, referenceId: params.userId },
    },
  });
  if (prior?.status === EmailFunnelStatus.COMPLETED || prior?.status === EmailFunnelStatus.ACTIVE) return;

  const firstDelay = FUNNEL_STEP_DELAYS.WELCOME_SIGNUP[0] ?? 0;
  const nextSendAt = new Date(Date.now() + hoursToMs(firstDelay));
  const metadata: Prisma.InputJsonValue = {
    firstName: firstNameFrom(params.name),
  };

  const enrollment = await prisma.emailFunnelEnrollment.upsert({
    where: {
      funnelType_referenceId: { funnelType: EmailFunnelType.WELCOME_SIGNUP, referenceId: params.userId },
    },
    create: {
      funnelType: EmailFunnelType.WELCOME_SIGNUP,
      userId: params.userId,
      email: params.email.toLowerCase(),
      referenceId: params.userId,
      stepIndex: 0,
      status: EmailFunnelStatus.ACTIVE,
      nextSendAt,
      metadata,
    },
    update: {
      email: params.email.toLowerCase(),
      status: EmailFunnelStatus.ACTIVE,
      metadata,
    },
  });

  if (enrollment.status === EmailFunnelStatus.ACTIVE && enrollment.stepIndex === 0 && firstDelay === 0) {
    const sent = await sendFunnelStepEmail(enrollment);
    if (sent.ok) {
      await advanceEnrollmentAfterSend(enrollment.id);
    }
  }
}

/** Abandoned cart — call after cart mutations when the cart has lines. */
export async function touchAbandonedCartFunnel(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, bannedAt: true },
  });
  if (!user?.email || user.bannedAt) return;

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { lines: true },
  });
  if (!cart) return;

  if (cart.lines.length === 0) {
    await cancelFunnelEnrollment(EmailFunnelType.ABANDONED_CART, cart.id);
    return;
  }

  const snapshot = await cartSnapshot(cart.id);
  const firstDelay = FUNNEL_STEP_DELAYS.ABANDONED_CART[0] ?? 1;
  const nextSendAt = new Date(Date.now() + hoursToMs(firstDelay));
  const metadata: Prisma.InputJsonValue = {
    firstName: firstNameFrom(user.name),
    cartSummary: snapshot.cartSummary,
    totalCents: snapshot.totalCents,
    lineCount: snapshot.lineCount,
  };

  const existing = await prisma.emailFunnelEnrollment.findUnique({
    where: {
      funnelType_referenceId: { funnelType: EmailFunnelType.ABANDONED_CART, referenceId: cart.id },
    },
  });

  if (!existing || existing.status === EmailFunnelStatus.CANCELLED || existing.status === EmailFunnelStatus.COMPLETED) {
    await prisma.emailFunnelEnrollment.upsert({
      where: {
        funnelType_referenceId: { funnelType: EmailFunnelType.ABANDONED_CART, referenceId: cart.id },
      },
      create: {
        funnelType: EmailFunnelType.ABANDONED_CART,
        userId,
        email: user.email,
        referenceId: cart.id,
        stepIndex: 0,
        status: EmailFunnelStatus.ACTIVE,
        nextSendAt,
        metadata,
      },
      update: {
        email: user.email,
        status: EmailFunnelStatus.ACTIVE,
        stepIndex: 0,
        lastSentAt: null,
        nextSendAt,
        metadata,
      },
    });
    return;
  }

  if (existing.status === EmailFunnelStatus.ACTIVE && existing.stepIndex === 0 && !existing.lastSentAt) {
    await prisma.emailFunnelEnrollment.update({
      where: { id: existing.id },
      data: { nextSendAt, email: user.email, metadata },
    });
  } else if (existing.status === EmailFunnelStatus.ACTIVE) {
    await prisma.emailFunnelEnrollment.update({
      where: { id: existing.id },
      data: { email: user.email, metadata },
    });
  }
}

export async function cancelAbandonedCartFunnel(cartId: string) {
  await cancelFunnelEnrollment(EmailFunnelType.ABANDONED_CART, cartId);
}

/** Unpaid order recovery — after checkout creates a PENDING_PAYMENT order. */
export async function enrollUnpaidOrderFunnel(params: {
  userId: string;
  email: string;
  orderId: string;
  orderNumber: string;
  totalCents: number;
  customerName?: string | null;
}) {
  const firstDelay = FUNNEL_STEP_DELAYS.UNPAID_ORDER[0] ?? 1;
  const nextSendAt = new Date(Date.now() + hoursToMs(firstDelay));
  const metadata: Prisma.InputJsonValue = {
    orderNumber: params.orderNumber,
    totalCents: params.totalCents,
    firstName: firstNameFrom(params.customerName),
  };

  await prisma.emailFunnelEnrollment.upsert({
    where: {
      funnelType_referenceId: { funnelType: EmailFunnelType.UNPAID_ORDER, referenceId: params.orderId },
    },
    create: {
      funnelType: EmailFunnelType.UNPAID_ORDER,
      userId: params.userId,
      email: params.email.toLowerCase(),
      referenceId: params.orderId,
      stepIndex: 0,
      status: EmailFunnelStatus.ACTIVE,
      nextSendAt,
      metadata,
    },
    update: {
      email: params.email.toLowerCase(),
      status: EmailFunnelStatus.ACTIVE,
      stepIndex: 0,
      lastSentAt: null,
      nextSendAt,
      metadata,
    },
  });
}

export async function cancelUnpaidOrderFunnel(orderId: string) {
  await cancelFunnelEnrollment(EmailFunnelType.UNPAID_ORDER, orderId);
}
