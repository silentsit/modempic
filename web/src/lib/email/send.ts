import { Resend } from "resend";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

function getResend() {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

async function logEmail(to: string, subject: string, template: string, status: "sent" | "failed", err?: string, providerId?: string) {
  await prisma.emailLog.create({
    data: { to, subject, template, status, error: err, providerId },
  });
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";
  const subject = "Reset your Modempic password";
  const r = getResend();
  if (!r) {
    console.log("[EMAIL stub] password reset to", to, resetLink);
    await logEmail(to, subject, "password-reset", "sent", "resend not configured; logged to console only");
    return;
  }
  const { data, error } = await r.emails.send({
    from,
    to,
    subject,
    text: `Reset your password: ${resetLink}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Click to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, ignore this message.</p>`,
  });
  if (error) {
    await logEmail(to, subject, "password-reset", "failed", String(error));
    return;
  }
  await logEmail(to, subject, "password-reset", "sent", undefined, data?.id);
}

type OrderLineSummary = { title: string; quantity: number; lineTotalCents: number };

export async function sendOrderPlacedEmail(
  to: string,
  order: { orderNumber: string; totalCents: number; lines: OrderLineSummary[]; paymentStatus: string },
) {
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";
  const subject = `Order ${order.orderNumber} — next step: complete payment`;
  const r = getResend();
  const lines = order.lines
    .map((l) => `• ${l.title} x${l.quantity} — $${(l.lineTotalCents / 100).toFixed(2)}`)
    .join("\n");
  const body = `Order ${order.orderNumber} (${order.paymentStatus}).\n\n${lines}\n\nTotal: $${(order.totalCents / 100).toFixed(2)}`;
  if (!r) {
    console.log("[EMAIL stub] order to", to, body);
    await logEmail(to, subject, "order-confirmation", "sent", "resend not configured");
    return;
  }
  const { data, error } = await r.emails.send({
    from,
    to,
    subject,
    text: body,
  });
  if (error) {
    await logEmail(to, subject, "order-confirmation", "failed", String(error));
    return;
  }
  await logEmail(to, subject, "order-confirmation", "sent", undefined, data?.id);
}

export async function sendOrderPaidEmail(to: string, orderNumber: string) {
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";
  const subject = `Payment received for ${orderNumber}`;
  const r = getResend();
  if (!r) {
    console.log("[EMAIL stub] paid for", to, orderNumber);
    await logEmail(to, subject, "order-paid", "sent", "resend not configured");
    return;
  }
  const { data, error } = await r.emails.send({
    from,
    to,
    subject,
    text: `Thank you! We have recorded payment for order ${orderNumber}.`,
  });
  if (error) {
    await logEmail(to, subject, "order-paid", "failed", String(error));
    return;
  }
  await logEmail(to, subject, "order-paid", "sent", undefined, data?.id);
}
