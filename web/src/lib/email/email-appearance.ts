import { z } from "zod";

export const emailAppearanceSchema = z.object({
  pageBackground: z.string().default("#f3f4f6"),
  containerMaxWidth: z.number().min(480).max(720).default(600),
  containerBg: z.string().default("#ffffff"),
  containerBorderRadius: z.number().min(0).max(24).default(3),
  containerBorderColor: z.string().default("#e5e7eb"),
  headerBackground: z.string().default("#0f5739"),
  headerTextColor: z.string().default("#ffffff"),
  accentColor: z.string().default("#1fad72"),
  loyaltyMessage: z
    .string()
    .max(2000)
    .default(
      "We truly value your continued business. Thank you for being a loyal customer, and we look forward to serving you in the future.",
    ),
  closingLine: z.string().max(500).default(""),
  showPromoFooter: z.boolean().default(true),
  promoFooterBackground: z.string().default("#2271b1"),
  promoFooterText: z
    .string()
    .max(2000)
    .default(
      "Follow us on social media for all SALE events and updates! Questions? Visit our Contact page to reach out. Our 24-hour Customer Support Specialists are always happy to help you.",
    ),
  socialFacebook: z.string().default(""),
  socialInstagram: z.string().default(""),
  socialPinterest: z.string().default(""),
});

export type EmailAppearance = z.infer<typeof emailAppearanceSchema>;

export const DEFAULT_EMAIL_APPEARANCE: EmailAppearance = emailAppearanceSchema.parse({});

/** Coerce JSON / partial saves so Zod accepts values from DB or older formats (strings for numbers, etc.). */
function coerceAppearanceInput(raw: unknown): unknown {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...src };

  for (const key of ["containerMaxWidth", "containerBorderRadius"] as const) {
    const v = out[key];
    if (typeof v === "number" && !Number.isFinite(v)) {
      delete out[key];
      continue;
    }
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) out[key] = n;
    }
  }

  if (typeof out.showPromoFooter === "string") {
    const s = out.showPromoFooter.toLowerCase().trim();
    out.showPromoFooter = s === "true" || s === "1" || s === "yes";
  }

  return out;
}

export function normalizeEmailAppearance(raw: unknown): EmailAppearance {
  const parsed = emailAppearanceSchema.safeParse(coerceAppearanceInput(raw));
  let data = parsed.success ? parsed.data : { ...DEFAULT_EMAIL_APPEARANCE };

  const header = data.headerBackground.toLowerCase();
  if (header === "#6b46c1" || header === "#1b4131") {
    data = { ...data, headerBackground: "#0f5739" };
  }

  const accent = data.accentColor.toLowerCase();
  if (accent === "#6b46c1") {
    data = { ...data, accentColor: "#1fad72" };
  }

  return data;
}
