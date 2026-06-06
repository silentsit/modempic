import type { EmailFunnelType } from "@prisma/client";
import { funnelContentKeyString } from "@/lib/email/funnel-defaults";
import { FUNNEL_STEP_DELAYS } from "@/lib/email/funnels/definitions";
import {
  buildResolvedCopy,
  interpolateEmailText,
  type EmailContentKey,
  type EmailContentSettings,
  type EmailPlaceholderVars,
} from "@/lib/email/email-content";
import { resolveEmailSubject } from "@/lib/email/resolve-email-content";
import { formatMoney } from "@/lib/email/templates/format";

export function funnelContentKey(funnelType: EmailFunnelType, stepIndex: number): EmailContentKey {
  return funnelContentKeyString(funnelType, stepIndex) as EmailContentKey;
}

export function isFunnelContentKey(key: string): boolean {
  return /^funnel-(welcome|abandoned-cart|unpaid-order)-\d+$/.test(key);
}

export function parseFunnelContentKey(key: EmailContentKey): { funnelType: EmailFunnelType; stepIndex: number } | null {
  const m = key.match(/^funnel-(welcome|abandoned-cart|unpaid-order)-(\d+)$/);
  if (!m) return null;
  const slug = m[1];
  const stepIndex = Number(m[2]);
  const funnelType = (
    slug === "welcome" ? "WELCOME_SIGNUP" : slug === "abandoned-cart" ? "ABANDONED_CART" : "UNPAID_ORDER"
  ) as EmailFunnelType;
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= FUNNEL_STEP_DELAYS[funnelType].length) {
    return null;
  }
  return { funnelType, stepIndex };
}

export function funnelContentLabel(key: EmailContentKey): string {
  const parsed = parseFunnelContentKey(key);
  if (!parsed) return key;
  const group =
    parsed.funnelType === "WELCOME_SIGNUP"
      ? "Welcome signup"
      : parsed.funnelType === "ABANDONED_CART"
        ? "Abandoned cart"
        : "Unpaid order";
  return `${group} — email ${parsed.stepIndex + 1}`;
}

export type ResolvedFunnelStepCopy = {
  subject: string;
  headline: string;
  preview: string;
  body: string;
  ctaLabel: string;
  ctaPath: string;
  footerNote: string;
};

export function funnelPlaceholderVars(meta: Record<string, unknown> | null): EmailPlaceholderVars {
  const firstName = typeof meta?.firstName === "string" ? meta.firstName.trim() : undefined;
  const orderNumber = typeof meta?.orderNumber === "string" ? meta.orderNumber : undefined;
  const totalCents = typeof meta?.totalCents === "number" ? meta.totalCents : undefined;
  const cartSummary = typeof meta?.cartSummary === "string" ? meta.cartSummary : undefined;
  return {
    customer_first_name: firstName,
    order_number: orderNumber,
    order_total: totalCents != null ? formatMoney(totalCents) : undefined,
    cart_summary: cartSummary,
    site_title: "Modempic",
  };
}

export function resolveFunnelStepCopy(
  settings: EmailContentSettings,
  funnelType: EmailFunnelType,
  stepIndex: number,
  vars: EmailPlaceholderVars,
): ResolvedFunnelStepCopy {
  const key = funnelContentKey(funnelType, stepIndex);
  const t = settings[key];
  const resolved = buildResolvedCopy(settings, key, vars);
  const subject = resolveEmailSubject(settings, key, vars, t.subject);
  return {
    subject,
    headline: resolved.heading,
    preview: resolved.subtitle,
    body: resolved.body,
    ctaLabel: interpolateEmailText(t.ctaLabel, vars),
    ctaPath: interpolateEmailText(t.ctaPath, vars),
    footerNote: resolved.additionalContent,
  };
}

export function defaultCtaPath(funnelType: EmailFunnelType, stepIndex: number): string {
  if (funnelType === "ABANDONED_CART") return "/cart";
  if (funnelType === "UNPAID_ORDER") return "/order/{order_number}/confirmation";
  if (stepIndex === 3) return "/contact";
  if (stepIndex === 2) return "/account";
  return "/category/modafinil";
}

export function resolveFunnelCtaHref(
  funnelType: EmailFunnelType,
  stepIndex: number,
  ctaPath: string,
  siteUrl: string,
  vars: EmailPlaceholderVars,
): string {
  const base = siteUrl.replace(/\/$/, "");
  const raw = (ctaPath.trim() || defaultCtaPath(funnelType, stepIndex)).trim();
  const path = interpolateEmailText(raw, vars);
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
