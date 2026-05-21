import { render, toPlainText } from "react-email";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import type { OrderEmailPayload } from "@/lib/email/types";
import { buildResolvedCopy, contentKeyForPreview } from "@/lib/email/email-content";
import { getEmailContentForSend } from "@/lib/email/email-content-store";
import { ModempicOrderEmail } from "@/lib/email/templates/modempic-order-email";
import { ModempicPasswordResetEmail } from "@/lib/email/templates/modempic-password-reset-email";
import { ModempicOrderShippedEmail } from "@/lib/email/templates/modempic-order-shipped-email";
import { getEmailAppearanceForSend } from "@/lib/email/appearance-store";
import { orderPayloadFromDb, placeholderVarsFromOrderPayload } from "@/lib/email/order-payload";
import { resolveEmailSubject } from "@/lib/email/resolve-email-content";
import { SITE_TITLE, formatOrderDate } from "@/lib/email/templates/format";
import { formatResendError } from "@/lib/email/format-resend-error";

function getResend() {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

async function logEmail(to: string, subject: string, template: string, status: "sent" | "failed", err?: string, providerId?: string) {
  await prisma.emailLog.create({
    data: { to, subject, template, status, error: err, providerId },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  opts?: { isSetPassword?: boolean },
) {
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";
  const isSetPassword = opts?.isSetPassword ?? false;
  const siteUrl = getSiteUrl();
  const [appearance, content] = await Promise.all([getEmailAppearanceForSend(), getEmailContentForSend()]);
  const key = contentKeyForPreview("password", undefined, isSetPassword);
  const copy = buildResolvedCopy(content, key, { site_title: SITE_TITLE });
  const subject = resolveEmailSubject(
    content,
    key,
    { site_title: SITE_TITLE },
    isSetPassword ? "Set your Modempic password" : "Reset your Modempic password",
  );
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
      copy={copy}
    />,
  );
  const text = toPlainText(html);
  const { data, error } = await r.emails.send({ from, to, subject, html, text });
  if (error) {
    await logEmail(to, subject, "password-reset", "failed", formatResendError(error));
    return;
  }
  await logEmail(to, subject, "password-reset", "sent", undefined, data?.id);
}

export async function sendOrderPlacedEmail(to: string, payload: OrderEmailPayload & { paymentStatus?: string }) {
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";
  const siteUrl = getSiteUrl();
  const [appearance, content] = await Promise.all([getEmailAppearanceForSend(), getEmailContentForSend()]);
  const key = contentKeyForPreview("order", "customer-order-placed");
  const vars = { ...placeholderVarsFromOrderPayload(payload), site_title: SITE_TITLE };
  const copy = buildResolvedCopy(content, key, vars);
  const subject = resolveEmailSubject(
    content,
    key,
    vars,
    `Order ${payload.orderNumber} — next step: complete payment`,
  );
  const r = getResend();
  const { paymentStatus: _ps, ...orderPayload } = payload;
  const element = (
    <ModempicOrderEmail
      {...orderPayload}
      siteUrl={siteUrl}
      variant="customer-order-placed"
      appearance={appearance}
      copy={copy}
    />
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
    await logEmail(to, subject, "order-confirmation", "failed", formatResendError(error));
    return;
  }
  await logEmail(to, subject, "order-confirmation", "sent", undefined, data?.id);
}

export async function sendAdminNewOrderEmail(to: string, payload: OrderEmailPayload) {
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";
  const dateStr = formatOrderDate(payload.orderDate);
  const siteUrl = getSiteUrl();
  const [appearance, content] = await Promise.all([getEmailAppearanceForSend(), getEmailContentForSend()]);
  const key = contentKeyForPreview("order", "admin-new-order");
  const vars = { ...placeholderVarsFromOrderPayload(payload), site_title: SITE_TITLE };
  const copy = buildResolvedCopy(content, key, vars);
  const subject = resolveEmailSubject(
    content,
    key,
    vars,
    `[${SITE_TITLE}] New customer order (${payload.orderNumber}) - (${dateStr})`,
  );
  const r = getResend();
  const element = (
    <ModempicOrderEmail {...payload} siteUrl={siteUrl} variant="admin-new-order" appearance={appearance} copy={copy} />
  );
  if (!r) {
    console.log("[EMAIL stub] admin new order", to, payload.orderNumber);
    await logEmail(to, subject, "admin-new-order", "sent", "resend not configured");
    return;
  }
  const html = await render(element);
  const text = toPlainText(html);
  const { data, error } = await r.emails.send({ from, to, subject, html, text });
  if (error) {
    await logEmail(to, subject, "admin-new-order", "failed", formatResendError(error));
    return;
  }
  await logEmail(to, subject, "admin-new-order", "sent", undefined, data?.id);
}

export async function sendOrderPaidEmail(to: string, orderNumber: string) {
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";
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
    const fallbackSubject = `Payment received for ${orderNumber}`;
    if (!r) {
      await logEmail(to, fallbackSubject, "order-paid", "sent", "order not found; resend not configured");
      return;
    }
    const { data, error } = await r.emails.send({
      from,
      to,
      subject: fallbackSubject,
      text: `Thank you! We have recorded payment for order ${orderNumber}.`,
    });
    if (error) await logEmail(to, fallbackSubject, "order-paid", "failed", formatResendError(error));
    else await logEmail(to, fallbackSubject, "order-paid", "sent", undefined, data?.id);
    return;
  }

  const payload = orderPayloadFromDb(order);
  const [appearance, content] = await Promise.all([getEmailAppearanceForSend(), getEmailContentForSend()]);
  const key = contentKeyForPreview("order", "customer-order-paid");
  const vars = { ...placeholderVarsFromOrderPayload(payload), site_title: SITE_TITLE };
  const copy = buildResolvedCopy(content, key, vars);
  const subject = resolveEmailSubject(
    content,
    key,
    vars,
    `Payment received for ${orderNumber}`,
  );
  const element = (
    <ModempicOrderEmail {...payload} siteUrl={siteUrl} variant="customer-order-paid" appearance={appearance} copy={copy} />
  );

  if (!r) {
    console.log("[EMAIL stub] order paid", to, orderNumber);
    await logEmail(to, subject, "order-paid", "sent", "resend not configured");
    return;
  }
  const html = await render(element);
  const text = toPlainText(html);
  const { data, error } = await r.emails.send({ from, to, subject, html, text });
  if (error) {
    await logEmail(to, subject, "order-paid", "failed", formatResendError(error));
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
  const siteUrl = getSiteUrl();
  const [appearance, content] = await Promise.all([getEmailAppearanceForSend(), getEmailContentForSend()]);

  const order = await prisma.order.findUnique({
    where: { orderNumber: args.orderNumber },
    include: {
      lines: true,
      shippingAddress: true,
      billingAddress: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      user: { select: { name: true } },
    },
  });
  const orderPayload = order ? orderPayloadFromDb(order) : null;
  const vars = orderPayload
    ? {
        ...placeholderVarsFromOrderPayload(orderPayload),
        tracking_number: args.trackingNumber,
        site_title: SITE_TITLE,
      }
    : {
        customer_first_name: args.customerName.split(/\s+/)[0] || args.customerName,
        customer_full_name: args.customerName,
        order_number: args.orderNumber,
        order_date: new Date().toISOString().slice(0, 10),
        tracking_number: args.trackingNumber,
        site_title: SITE_TITLE,
      };
  const key = contentKeyForPreview("shipped");
  const copy = buildResolvedCopy(content, key, vars);
  const subject = resolveEmailSubject(
    content,
    key,
    vars,
    `Your order ${args.orderNumber} — tracking info`,
  );

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
      copy={copy}
      orderPayload={orderPayload}
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
    await logEmail(to, subject, "order-shipped", "failed", formatResendError(error));
    return;
  }
  await logEmail(to, subject, "order-shipped", "sent", undefined, data?.id);
}
