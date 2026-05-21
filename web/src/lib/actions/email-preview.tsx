"use server";

import { render, toPlainText } from "react-email";
import { Resend } from "resend";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  buildResolvedCopy,
  contentKeyForPreview,
  normalizeEmailContentSettings,
  type EmailContentSettings,
} from "@/lib/email/email-content";
import type { EmailAppearance } from "@/lib/email/email-appearance";
import { normalizeEmailAppearance } from "@/lib/email/email-appearance";
import { orderPayloadFromDb, placeholderVarsFromOrderPayload } from "@/lib/email/order-payload";
import { PREVIEW_ORDER_PAYLOAD } from "@/lib/email/preview-fixtures";
import { resolveEmailSubject } from "@/lib/email/resolve-email-content";
import { ModempicOrderEmail } from "@/lib/email/templates/modempic-order-email";
import { ModempicPasswordResetEmail } from "@/lib/email/templates/modempic-password-reset-email";
import { ModempicOrderShippedEmail } from "@/lib/email/templates/modempic-order-shipped-email";
import { SITE_TITLE } from "@/lib/email/templates/format";
import { getSiteUrl } from "@/lib/site-url";
import { formatResendError } from "@/lib/email/format-resend-error";
import type { OrderEmailPayload } from "@/lib/email/types";

export type PreviewKind = "order" | "password" | "shipped";
export type PreviewOrderVariant = "customer-order-placed" | "customer-order-paid" | "admin-new-order";

function getResend() {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

async function logPreviewEmail(to: string, subject: string, status: "sent" | "failed", err?: string, providerId?: string) {
  await prisma.emailLog.create({
    data: { to, subject, template: "email-preview-send", status, error: err, providerId },
  });
}

async function loadPreviewOrderPayload(previewOrderId?: string): Promise<OrderEmailPayload> {
  if (!previewOrderId) return PREVIEW_ORDER_PAYLOAD;
  const order = await prisma.order.findUnique({
    where: { id: previewOrderId },
    include: {
      lines: true,
      shippingAddress: true,
      billingAddress: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      user: { select: { name: true } },
    },
  });
  if (!order) return PREVIEW_ORDER_PAYLOAD;
  return orderPayloadFromDb(order);
}

export async function listEmailPreviewOrdersAction(): Promise<
  { id: string; orderNumber: string; label: string }[]
> {
  await requireStaff();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      shippingAddress: { select: { fullName: true } },
      user: { select: { name: true, email: true } },
    },
  });
  return orders.map((o) => {
    const name = o.shippingAddress?.fullName ?? o.user?.name ?? o.user?.email ?? "Customer";
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      label: `${o.orderNumber} — ${name} (${o.createdAt.toISOString().slice(0, 10)})`,
    };
  });
}

async function buildPreviewHtmlAndSubject(input: {
  appearance: EmailAppearance;
  content: EmailContentSettings;
  kind: PreviewKind;
  orderVariant?: PreviewOrderVariant;
  previewOrderId?: string;
  passwordPreviewMode?: "reset" | "set";
}): Promise<{ html: string; subject: string }> {
  const siteUrl = getSiteUrl();
  const { appearance, content, kind, orderVariant, previewOrderId, passwordPreviewMode } = input;
  const orderPayload = await loadPreviewOrderPayload(
    kind === "order" || kind === "shipped" ? previewOrderId : undefined,
  );
  const vars = {
    ...placeholderVarsFromOrderPayload(orderPayload),
    tracking_number: "LF359463512IN",
    site_title: SITE_TITLE,
  };

  if (kind === "order") {
    const variant = orderVariant ?? "customer-order-placed";
    const key = contentKeyForPreview("order", variant);
    const copy = buildResolvedCopy(content, key, vars);
    const html = await render(
      <ModempicOrderEmail
        {...orderPayload}
        siteUrl={siteUrl}
        variant={variant}
        appearance={appearance}
        copy={copy}
      />,
    );
    const fallback =
      variant === "admin-new-order"
        ? `[${SITE_TITLE}] New customer order ({order_number}) - ({order_date})`
        : variant === "customer-order-paid"
          ? `Payment received for {order_number}`
          : `Order {order_number} — next step: complete payment`;
    const subject = resolveEmailSubject(content, key, vars, fallback);
    return { html, subject: `[Preview] ${subject}` };
  }

  if (kind === "password") {
    const isSet = passwordPreviewMode === "set";
    const key = contentKeyForPreview("password", undefined, isSet);
    const copy = buildResolvedCopy(content, key, { site_title: SITE_TITLE, customer_first_name: "Kathleen" });
    const html = await render(
      <ModempicPasswordResetEmail
        siteUrl={siteUrl}
        resetLink={`${siteUrl}/reset-password?token=demo`}
        appearance={appearance}
        isSetPassword={isSet}
        copy={copy}
      />,
    );
    const subject = resolveEmailSubject(
      content,
      key,
      { site_title: SITE_TITLE },
      isSet ? "Set your Modempic password" : "Reset your Modempic password",
    );
    return { html, subject: `[Preview] ${subject}` };
  }

  const key = contentKeyForPreview("shipped");
  const copy = buildResolvedCopy(content, key, vars);
  const firstName = vars.customer_first_name;
  const html = await render(
    <ModempicOrderShippedEmail
      siteUrl={siteUrl}
      orderNumber={orderPayload.orderNumber}
      customerName={firstName}
      trackingNumber={vars.tracking_number ?? "LF359463512IN"}
      trackingCarrier="India Post"
      shippingMethod={orderPayload.shippingMethod}
      appearance={appearance}
      copy={copy}
      orderPayload={orderPayload}
    />,
  );
  const subject = resolveEmailSubject(
    content,
    key,
    vars,
    `Your order {order_number} — tracking info`,
  );
  return { html, subject: `[Preview] ${subject}` };
}

export type RenderEmailPreviewResult = { html: string; subject: string } | { error: string };

export async function renderEmailPreviewAction(input: {
  kind: PreviewKind;
  appearance: unknown;
  content: unknown;
  orderVariant?: PreviewOrderVariant;
  previewOrderId?: string;
  passwordPreviewMode?: "reset" | "set";
}): Promise<RenderEmailPreviewResult> {
  await requireStaff();
  try {
    const appearance = normalizeEmailAppearance(input.appearance);
    const content = normalizeEmailContentSettings(input.content);
    const { html, subject } = await buildPreviewHtmlAndSubject({
      appearance,
      content,
      kind: input.kind,
      orderVariant: input.orderVariant,
      previewOrderId: input.previewOrderId,
      passwordPreviewMode: input.passwordPreviewMode,
    });
    return { html, subject };
  } catch (e) {
    console.error("[renderEmailPreviewAction]", e);
    return { error: e instanceof Error ? e.message : "Preview render failed" };
  }
}

const sendPreviewSchema = z.object({
  to: z.string().trim().email(),
  kind: z.enum(["order", "password", "shipped"]),
  appearance: z.unknown(),
  content: z.unknown(),
  orderVariant: z.enum(["admin-new-order", "customer-order-placed", "customer-order-paid"]).optional(),
  previewOrderId: z.string().optional(),
  passwordPreviewMode: z.enum(["reset", "set"]).optional(),
});

export type SendEmailPreviewResult = { ok: true } | { ok: false; error: string };

export async function sendEmailPreviewAction(raw: z.infer<typeof sendPreviewSchema>): Promise<SendEmailPreviewResult> {
  await requireStaff();
  const parsed = sendPreviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const v = parsed.data;
  const appearance = normalizeEmailAppearance(v.appearance);
  const content = normalizeEmailContentSettings(v.content);
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";

  let html: string;
  let subject: string;
  try {
    const built = await buildPreviewHtmlAndSubject({
      appearance,
      content,
      kind: v.kind,
      orderVariant: v.kind === "order" ? v.orderVariant : undefined,
      previewOrderId: v.previewOrderId,
      passwordPreviewMode: v.passwordPreviewMode,
    });
    html = built.html;
    subject = built.subject;
  } catch (e) {
    console.error("[email preview send] render failed", e);
    return { ok: false, error: "Could not build preview email." };
  }

  const text = toPlainText(html);
  const r = getResend();
  if (!r) {
    await logPreviewEmail(v.to, subject, "failed", "RESEND_API_KEY not configured");
    return { ok: false, error: "Email is not configured (set RESEND_API_KEY and EMAIL_FROM)." };
  }

  const { data, error } = await r.emails.send({ from, to: v.to, subject, html, text });
  if (error) {
    const msg = formatResendError(error);
    await logPreviewEmail(v.to, subject, "failed", msg);
    return { ok: false, error: msg };
  }
  await logPreviewEmail(v.to, subject, "sent", undefined, data?.id);
  return { ok: true };
}
