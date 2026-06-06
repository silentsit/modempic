import { render, toPlainText } from "react-email";
import type { EmailFunnelEnrollment } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getSiteUrl } from "@/lib/site-url";
import { Resend } from "resend";
import { formatResendError } from "@/lib/email/format-resend-error";
import { getEmailAppearanceForSend } from "@/lib/email/appearance-store";
import { getEmailContentForSend } from "@/lib/email/email-content-store";
import { ModempicFunnelEmail } from "@/lib/email/templates/modempic-funnel-email";
import {
  funnelPlaceholderVars,
  resolveFunnelCtaHref,
  resolveFunnelStepCopy,
} from "@/lib/email/funnel-content";
import { funnelStepCount, funnelTemplateKey } from "@/lib/email/funnels/definitions";

function getResend() {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

async function logEmail(
  to: string,
  subject: string,
  template: string,
  status: "sent" | "failed",
  err?: string,
  providerId?: string,
) {
  await prisma.emailLog.create({
    data: { to, subject, template, status, error: err, providerId },
  });
}

export async function sendFunnelStepEmail(
  enrollment: Pick<EmailFunnelEnrollment, "funnelType" | "stepIndex" | "email" | "metadata" | "id">,
): Promise<{ ok: boolean; providerId?: string; error?: string }> {
  if (enrollment.stepIndex >= funnelStepCount(enrollment.funnelType)) {
    return { ok: false, error: "invalid step" };
  }

  const siteUrl = getSiteUrl();
  const [appearance, content] = await Promise.all([getEmailAppearanceForSend(), getEmailContentForSend()]);
  const meta =
    enrollment.metadata && typeof enrollment.metadata === "object" && !Array.isArray(enrollment.metadata)
      ? (enrollment.metadata as Record<string, unknown>)
      : null;
  const vars = funnelPlaceholderVars(meta);
  const copy = resolveFunnelStepCopy(content, enrollment.funnelType, enrollment.stepIndex, vars);
  const ctaHref = resolveFunnelCtaHref(
    enrollment.funnelType,
    enrollment.stepIndex,
    copy.ctaPath,
    siteUrl,
    vars,
  );
  const template = funnelTemplateKey(enrollment.funnelType, enrollment.stepIndex);
  const from = env.EMAIL_FROM ?? "onboarding@resend.dev";

  const element = (
    <ModempicFunnelEmail
      siteUrl={siteUrl}
      headline={copy.headline}
      preview={copy.preview}
      body={copy.body}
      ctaLabel={copy.ctaLabel}
      ctaHref={ctaHref}
      appearance={appearance}
      footerNote={copy.footerNote.trim() || undefined}
    />
  );

  const r = getResend();
  if (!r) {
    console.log("[EMAIL stub] funnel", enrollment.funnelType, enrollment.stepIndex, enrollment.email);
    await logEmail(enrollment.email, copy.subject, template, "sent", "resend not configured");
    return { ok: true };
  }

  const html = await render(element);
  const text = toPlainText(html);
  const { data, error } = await r.emails.send({
    from,
    to: enrollment.email,
    subject: copy.subject,
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": `funnel-${enrollment.id}-step-${enrollment.stepIndex}`,
    },
  });

  if (error) {
    const msg = formatResendError(error);
    await logEmail(enrollment.email, copy.subject, template, "failed", msg);
    return { ok: false, error: msg };
  }

  await logEmail(enrollment.email, copy.subject, template, "sent", undefined, data?.id);
  return { ok: true, providerId: data?.id };
}
