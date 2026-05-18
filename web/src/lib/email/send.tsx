import { render, toPlainText } from "react-email";
import type { Address } from "@prisma/client";
import { PaymentMethod } from "@prisma/client";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import type { EmailAddressBlock, OrderEmailPayload } from "@/lib/email/types";
import { ModempicOrderEmail } from "@/lib/email/templates/modempic-order-email";
import { ModempicPasswordResetEmail } from "@/lib/email/templates/modempic-password-reset-email";
import { ModempicOrderShippedEmail } from "@/lib/email/templates/modempic-order-shipped-email";
import { getEmailAppearanceForSend } from "@/lib/email/appearance-store";
import { SITE_TITLE, formatOrderDate } from "@/lib/email/templates/format";

function getResend() {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

async function logEmail(to: string, subject: string, template: string, status: "sent" | "failed", err?: string, providerId?: string) {
  await prisma.emailLog.create({
    data: { to, subject, template, status, error: err, providerId },
  });
}

function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.CARD_ONRAMP:
      return "Credit/Debit Cards (Visa/MasterCard/Amex/Discover)";
    case PaymentMethod.CRYPTO:
      return "Cryptocurrency";
    default:
      return String(method);
  }
}

function blockFromAddress(a: Address | null): EmailAddressBlock {
  if (!a) {
    return { fullName: "—", line1: "—", city: "—", state: "—", postal: "—" };
  }
  return {
    fullName: a.fullName,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    postal: a.postal,
    country: a.country,
    phone: a.phone,
  };
}

function orderPayloadFromDb(order: {
  orderNumber: string;
  createdAt: Date;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  shippingMethod: string | null;
  lines: { title: string; quantity: number; lineTotalCents: number }[];
  shippingAddress: Address | null;
  billingAddress: Address | null;
  payments: { method: PaymentMethod }[];
  user: { name: string | null } | null;
}): OrderEmailPayload {
  const lastPay = order.payments[0];
  return {
    orderNumber: order.orderNumber,
    customerFullName: order.shippingAddress?.fullName ?? order.user?.name ?? "Customer",
    orderDate: order.createdAt,
    lines: order.lines.map((l) => ({
      title: l.title,
      quantity: l.quantity,
      lineTotalCents: l.lineTotalCents,
    })),
    subtotalCents: order.subtotalCents,
    taxCents: order.taxCents,
    shippingCents: order.shippingCents,
    discountCents: order.discountCents,
    totalCents: order.totalCents,
    shippingMethod: order.shippingMethod ?? "Standard",
    paymentMethod: lastPay ? paymentMethodLabel(lastPay.method) : "Paid",
    shippingAddress: blockFromAddress(order.shippingAddress),
    billingAddress: blockFromAddress(order.billingAddress),
  };
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  opts?: { isSetPassword?: boolean },
) {
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";
  const isSetPassword = opts?.isSetPassword ?? false;
  const subject = isSetPassword ? "Set your Modempic password" : "Reset your Modempic password";
  const siteUrl = getSiteUrl();
  const appearance = await getEmailAppearanceForSend();
  const r = getResend();
  if (!r) {
    console.log("[EMAIL stub] password reset to", to, resetLink);
    await logEmail(to, subject, "password-reset", "sent", "resend not configured; logged to console only");
    return;
  }
  const html = await render(
    <ModempicPasswordResetEmail
      siteUrl={siteUrl}
      resetLink={resetLink}
      appearance={appearance}
      isSetPassword={isSetPassword}
    />,
  );
  const text = toPlainText(html);
  const { data, error } = await r.emails.send({ from, to, subject, html, text });
  if (error) {
    await logEmail(to, subject, "password-reset", "failed", String(error));
    return;
  }
  await logEmail(to, subject, "password-reset", "sent", undefined, data?.id);
}

export async function sendOrderPlacedEmail(to: string, payload: OrderEmailPayload & { paymentStatus?: string }) {
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";
  const subject = `Order ${payload.orderNumber} — next step: complete payment`;
  const siteUrl = getSiteUrl();
  const appearance = await getEmailAppearanceForSend();
  const r = getResend();
  const { paymentStatus: _ps, ...orderPayload } = payload;
  const element = (
    <ModempicOrderEmail {...orderPayload} siteUrl={siteUrl} variant="customer-order-placed" appearance={appearance} />
  );
  if (!r) {
    console.log("[EMAIL stub] order placed", to, payload.orderNumber, _ps);
    await logEmail(to, subject, "order-confirmation", "sent", "resend not configured");
    return;
  }
  const html = await render(element);
  const text = toPlainText(html);
  const { data, error } = await r.emails.send({ from, to, subject, html, text });
  if (error) {
    await logEmail(to, subject, "order-confirmation", "failed", String(error));
    return;
  }
  await logEmail(to, subject, "order-confirmation", "sent", undefined, data?.id);
}

export async function sendAdminNewOrderEmail(to: string, payload: OrderEmailPayload) {
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";
  const dateStr = formatOrderDate(payload.orderDate);
  const subject = `[${SITE_TITLE}] New customer order (${payload.orderNumber}) - (${dateStr})`;
  const siteUrl = getSiteUrl();
  const appearance = await getEmailAppearanceForSend();
  const r = getResend();
  const element = <ModempicOrderEmail {...payload} siteUrl={siteUrl} variant="admin-new-order" appearance={appearance} />;
  if (!r) {
    console.log("[EMAIL stub] admin new order", to, payload.orderNumber);
    await logEmail(to, subject, "admin-new-order", "sent", "resend not configured");
    return;
  }
  const html = await render(element);
  const text = toPlainText(html);
  const { data, error } = await r.emails.send({ from, to, subject, html, text });
  if (error) {
    await logEmail(to, subject, "admin-new-order", "failed", String(error));
    return;
  }
  await logEmail(to, subject, "admin-new-order", "sent", undefined, data?.id);
}

export async function sendOrderPaidEmail(to: string, orderNumber: string) {
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";
  const subject = `Payment received for ${orderNumber}`;
  const siteUrl = getSiteUrl();
  const r = getResend();

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      lines: true,
      shippingAddress: true,
      billingAddress: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      user: { select: { name: true } },
    },
  });

  if (!order) {
    console.warn("[EMAIL] sendOrderPaidEmail: order not found", orderNumber);
    if (!r) {
      await logEmail(to, subject, "order-paid", "sent", "order not found; resend not configured");
      return;
    }
    const { data, error } = await r.emails.send({
      from,
      to,
      subject,
      text: `Thank you! We have recorded payment for order ${orderNumber}.`,
    });
    if (error) await logEmail(to, subject, "order-paid", "failed", String(error));
    else await logEmail(to, subject, "order-paid", "sent", undefined, data?.id);
    return;
  }

  const payload = orderPayloadFromDb(order);
  const appearance = await getEmailAppearanceForSend();
  const element = <ModempicOrderEmail {...payload} siteUrl={siteUrl} variant="customer-order-paid" appearance={appearance} />;

  if (!r) {
    console.log("[EMAIL stub] order paid", to, orderNumber);
    await logEmail(to, subject, "order-paid", "sent", "resend not configured");
    return;
  }
  const html = await render(element);
  const text = toPlainText(html);
  const { data, error } = await r.emails.send({ from, to, subject, html, text });
  if (error) {
    await logEmail(to, subject, "order-paid", "failed", String(error));
    return;
  }
  await logEmail(to, subject, "order-paid", "sent", undefined, data?.id);
}

export async function sendOrderShippedEmail(
  to: string,
  args: {
    orderNumber: string;
    customerName: string;
    trackingNumber: string;
    trackingCarrier: string;
    shippingMethod?: string | null;
  },
) {
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";
  const subject = `Your order ${args.orderNumber} — tracking info`;
  const siteUrl = getSiteUrl();
  const appearance = await getEmailAppearanceForSend();
  const r = getResend();
  const element = (
    <ModempicOrderShippedEmail
      siteUrl={siteUrl}
      orderNumber={args.orderNumber}
      customerName={args.customerName}
      trackingNumber={args.trackingNumber}
      trackingCarrier={args.trackingCarrier}
      shippingMethod={args.shippingMethod}
      appearance={appearance}
    />
  );
  if (!r) {
    console.log("[EMAIL stub] order shipped", to, args.orderNumber, args.trackingNumber);
    await logEmail(to, subject, "order-shipped", "sent", "resend not configured");
    return;
  }
  const html = await render(element);
  const text = toPlainText(html);
  const { data, error } = await r.emails.send({ from, to, subject, html, text });
  if (error) {
    await logEmail(to, subject, "order-shipped", "failed", String(error));
    return;
  }
  await logEmail(to, subject, "order-shipped", "sent", undefined, data?.id);
}
