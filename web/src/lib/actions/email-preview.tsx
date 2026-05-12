"use server";

import { render, toPlainText } from "react-email";
import { Resend } from "resend";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getSiteUrl } from "@/lib/site-url";
import type { EmailAppearance } from "@/lib/email/email-appearance";
import { normalizeEmailAppearance } from "@/lib/email/email-appearance";
import { PREVIEW_ORDER_PAYLOAD } from "@/lib/email/preview-fixtures";
import { ModempicOrderEmail } from "@/lib/email/templates/modempic-order-email";
import { ModempicPasswordResetEmail } from "@/lib/email/templates/modempic-password-reset-email";
import { ModempicOrderShippedEmail } from "@/lib/email/templates/modempic-order-shipped-email";
import { SITE_TITLE } from "@/lib/email/templates/format";

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

async function buildPreviewHtmlAndSubject(input: {
  appearance: EmailAppearance;
  kind: PreviewKind;
  orderVariant?: PreviewOrderVariant;
}): Promise<{ html: string; subject: string }> {
  const siteUrl = getSiteUrl();
  const { appearance, kind, orderVariant } = input;

  if (kind === "order") {
    const variant = orderVariant ?? "admin-new-order";
    const html = await render(
      <ModempicOrderEmail {...PREVIEW_ORDER_PAYLOAD} siteUrl={siteUrl} variant={variant} appearance={appearance} />,
    );
    const subject =
      variant === "admin-new-order"
        ? `[${SITE_TITLE}] Preview: New order (sample)`
        : variant === "customer-order-paid"
          ? `[${SITE_TITLE}] Preview: Payment received (sample)`
          : `[${SITE_TITLE}] Preview: Order placed (sample)`;
    return { html, subject };
  }

  if (kind === "password") {
    const html = await render(
      <ModempicPasswordResetEmail siteUrl={siteUrl} resetLink={`${siteUrl}/reset-password?token=demo`} appearance={appearance} />,
    );
    return { html, subject: `[${SITE_TITLE}] Preview: Password reset` };
  }

  const html = await render(
    <ModempicOrderShippedEmail
      siteUrl={siteUrl}
      orderNumber={PREVIEW_ORDER_PAYLOAD.orderNumber}
      customerName={PREVIEW_ORDER_PAYLOAD.customerFullName}
      trackingNumber="1Z999AA10123456784"
      trackingCarrier="UPS"
      shippingMethod="Express Shipping"
      appearance={appearance}
    />,
  );
  return { html, subject: `[${SITE_TITLE}] Preview: Tracking / shipped` };
}

export type RenderEmailPreviewResult = { html: string } | { error: string };

export async function renderEmailPreviewAction(input: {
  kind: PreviewKind;
  appearance: unknown;
  orderVariant?: PreviewOrderVariant;
}): Promise<RenderEmailPreviewResult> {
  await requireStaff();
  try {
    const appearance = normalizeEmailAppearance(input.appearance);
    const { html } = await buildPreviewHtmlAndSubject({
      appearance,
      kind: input.kind,
      orderVariant: input.orderVariant,
    });
    return { html };
  } catch (e) {
    console.error("[renderEmailPreviewAction]", e);
    return { error: e instanceof Error ? e.message : "Preview render failed" };
  }
}

const sendPreviewSchema = z.object({
  to: z.string().trim().email(),
  kind: z.enum(["order", "password", "shipped"]),
  appearance: z.unknown(),
  orderVariant: z.enum(["admin-new-order", "customer-order-placed", "customer-order-paid"]).optional(),
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
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";

  let html: string;
  let subject: string;
  try {
    const built = await buildPreviewHtmlAndSubject({
      appearance,
      kind: v.kind,
      orderVariant: v.kind === "order" ? v.orderVariant : undefined,
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
    await logPreviewEmail(v.to, subject, "failed", String(error));
    return { ok: false, error: String(error) };
  }
  await logPreviewEmail(v.to, subject, "sent", undefined, data?.id);
  return { ok: true };
}
