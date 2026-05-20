import { z } from "zod";

/** Keys align with preview/send variants. */
export const EMAIL_CONTENT_KEYS = [
  "customer-order-placed",
  "customer-order-paid",
  "admin-new-order",
  "shipped",
  "password-reset",
  "password-set",
] as const;

export type EmailContentKey = (typeof EMAIL_CONTENT_KEYS)[number];

export const emailTemplateContentSchema = z.object({
  subject: z.string().max(300).default(""),
  heading: z.string().max(300).default(""),
  subtitle: z.string().max(300).default(""),
  body: z.string().max(12000).default(""),
  additionalContent: z.string().max(20000).default(""),
});

export type EmailTemplateContent = z.infer<typeof emailTemplateContentSchema>;

export type EmailContentSettings = Record<EmailContentKey, EmailTemplateContent>;

export type ResolvedEmailCopy = {
  heading: string;
  subtitle: string;
  body: string;
  additionalContent: string;
};

export function buildResolvedCopy(
  settings: EmailContentSettings,
  key: EmailContentKey,
  vars: EmailPlaceholderVars,
): ResolvedEmailCopy {
  const t = settings[key];
  return {
    heading: interpolateEmailText(t.heading, vars),
    subtitle: interpolateEmailText(t.subtitle, vars),
    body: interpolateEmailText(t.body, vars),
    additionalContent: interpolateEmailText(t.additionalContent, vars),
  };
}

export const DEFAULT_EMAIL_CONTENT: EmailContentSettings = {
  "customer-order-placed": {
    subject: "Order {order_number} — next step: complete payment",
    heading: "Your order: {order_number}",
    subtitle: "",
    body: "Hi {customer_first_name}, thanks for your order. Complete payment using the link from checkout (or open your order below). Here is what we have on file:",
    additionalContent: "",
  },
  "customer-order-paid": {
    subject: "Payment received for {order_number}",
    heading: "Payment received — {order_number}",
    subtitle: "",
    body: "Thank you, {customer_first_name}. We have recorded payment for your order. Here is a summary:",
    additionalContent: "",
  },
  "admin-new-order": {
    subject: "[Modempic] New customer order ({order_number}) — ({order_date})",
    heading: "New Order: {order_number}",
    subtitle: "",
    body: "You have received an order from {customer_first_name}. The order is as follows:",
    additionalContent: "",
  },
  shipped: {
    subject: "[Modempic] Your tracking number is here",
    heading: "Your Order is On The Way to You",
    subtitle: "Tracking Number",
    body: "Hey {customer_first_name},\n\nYour order ({order_number}) has been dispatched, and is on the way to you. Please see your order details below, and you will find your tracking number under the order details.",
    additionalContent:
      "How to track your package\n\nUse the tracking number above with your carrier's website, or a universal tracker such as 17track.net.",
  },
  "password-reset": {
    subject: "Reset your Modempic password",
    heading: "Reset your password",
    subtitle: "",
    body: "We received a request to reset the password for your Modempic account. Use the button below to choose a new password.",
    additionalContent: "If you did not request this, you can ignore this email. This link expires after a short time.",
  },
  "password-set": {
    subject: "Set your Modempic password",
    heading: "Set your password",
    subtitle: "",
    body: "Create a password for your Modempic account so you can sign in with email and password (you can still use social sign-in if you prefer).",
    additionalContent: "If you did not request this, you can ignore this email. This link expires after a short time.",
  },
};

export type EmailPlaceholderVars = {
  customer_first_name?: string;
  customer_full_name?: string;
  order_number?: string;
  order_date?: string;
  tracking_number?: string;
  site_title?: string;
};

export function interpolateEmailText(template: string, vars: EmailPlaceholderVars): string {
  let out = template;
  const map: Record<string, string | undefined> = {
    "{customer_first_name}": vars.customer_first_name,
    "{customer_full_name}": vars.customer_full_name,
    "{order_number}": vars.order_number,
    "{order_date}": vars.order_date,
    "{tracking_number}": vars.tracking_number,
    "{site_title}": vars.site_title ?? "Modempic",
  };
  for (const [token, value] of Object.entries(map)) {
    if (value != null) out = out.split(token).join(value);
  }
  return out;
}

export function normalizeEmailContentSettings(raw: unknown): EmailContentSettings {
  const base = { ...DEFAULT_EMAIL_CONTENT };
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return base;
  const src = raw as Record<string, unknown>;
  for (const key of EMAIL_CONTENT_KEYS) {
    const block = src[key];
    if (block == null || typeof block !== "object" || Array.isArray(block)) continue;
    const parsed = emailTemplateContentSchema.safeParse(block);
    if (parsed.success) {
      base[key] = { ...base[key], ...parsed.data };
    }
  }
  return base;
}

export function contentKeyForPreview(
  kind: "order" | "password" | "shipped",
  orderVariant?: string,
  isSetPassword?: boolean,
): EmailContentKey {
  if (kind === "shipped") return "shipped";
  if (kind === "password") return isSetPassword ? "password-set" : "password-reset";
  if (orderVariant === "admin-new-order") return "admin-new-order";
  if (orderVariant === "customer-order-paid") return "customer-order-paid";
  return "customer-order-placed";
}
