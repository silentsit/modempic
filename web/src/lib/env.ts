import { z } from "zod";

/** Empty string in Vercel/dashboard env is common; treat as unset so z.url() does not throw at startup. */
function emptyToUndef<T extends string | undefined | null>(v: T) {
  if (v == null) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}

const optionalUrl = z.preprocess(
  (v) => (emptyToUndef(v as string) === undefined ? undefined : v),
  z.string().url().optional(),
);

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: optionalUrl,
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: optionalUrl,
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  INSTAGRAM_CLIENT_ID: z.string().optional(),
  INSTAGRAM_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.preprocess(
    (v) => (emptyToUndef(v as string) === undefined ? undefined : v),
    z.string().email().optional(),
  ),
  /** Optional staff inbox for “new order” notifications (mirrors Woo admin new-order email). */
  ADMIN_ORDER_NOTIFICATION_EMAIL: z.preprocess(
    (v) => (emptyToUndef(v as string) === undefined ? undefined : v),
    z.string().email().optional(),
  ),
  CRON_SECRET: z.string().optional(),
  DEV_PAYMENT_SIMULATE: z.enum(["0", "1"]).optional(),
  CRYPTO_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: optionalUrl,
  /** Paymento — https://docs.paymento.io */
  PAYMENTO_API_KEY: z.string().optional(),
  PAYMENTO_SECRET_KEY: z.string().optional(),
  PAYMENTO_SPEED: z.enum(["0", "1"]).optional(),
  PAYMENTO_API_BASE: optionalUrl,
  PAYMENTO_GATEWAY_BASE: optionalUrl,
  /** Optional override that forces crypto checkout through Paymento. Unknown values (e.g. leftover btcpay) are ignored. */
  CRYPTO_PROVIDER: z.preprocess(
    (v) => (v === "paymento" ? v : undefined),
    z.literal("paymento").optional(),
  ),
  /** PeptidePay — hosted card / Apple Pay / Google Pay / crypto on-ramp. */
  PEPTIDEPAY_API_KEY: z.string().optional(),
  PEPTIDEPAY_WEBHOOK_SECRET: z.string().optional(),
  PEPTIDEPAY_API_BASE: optionalUrl,
  /** JSON array fallback when no COMPLETED orders: `[{ message, completedAtIso }]` */
  SOCIAL_PROOF_DEMO_JSON: z.string().optional(),
  /** Default activity window days (also capped in API queries). */
  SOCIAL_PROOF_WINDOW_DAYS: z.coerce.number().int().min(1).max(14).optional(),
  /** Google Search Console HTML-tag verification token (not the service-account JSON). */
  GOOGLE_SITE_VERIFICATION: z.string().min(1).optional(),
});

const BUILD_PHASES = new Set([
  "phase-production-build",
  "phase-development-build",
]);

function shouldUseCoreEnvPlaceholders() {
  if (process.env.SKIP_ENV_VALIDATION === "1") return false;
  if (process.env.DATABASE_URL && process.env.AUTH_SECRET) return false;
  /** `next dev` (e.g. Playwright) often runs with no `.env` — same placeholders as build analysis. */
  if (process.env.NODE_ENV === "development") return true;
  if (BUILD_PHASES.has(process.env.NEXT_PHASE ?? "")) return true;
  if (process.env.npm_lifecycle_event === "build") return true;
  return false;
}

const PLACEHOLDER_DB = "postgresql://127.0.0.1:5432/placeholder";
const PLACEHOLDER_AUTH = "00000000000000000000000000000000";

/** Build / dev without a real `.env`: stand-ins for Zod; also sync `process.env` for Prisma and NextAuth. */
function envWithBuildPlaceholders() {
  if (process.env.SKIP_ENV_VALIDATION === "1") return process.env;
  if (!shouldUseCoreEnvPlaceholders()) return process.env;
  if (!process.env.DATABASE_URL) process.env.DATABASE_URL = PLACEHOLDER_DB;
  if (!process.env.AUTH_SECRET) process.env.AUTH_SECRET = PLACEHOLDER_AUTH;
  return {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? PLACEHOLDER_DB,
    AUTH_SECRET: process.env.AUTH_SECRET ?? PLACEHOLDER_AUTH,
  };
}

function parse() {
  const envSrc = envWithBuildPlaceholders();
  const s = {
    DATABASE_URL: envSrc.DATABASE_URL,
    DIRECT_URL: envSrc.DIRECT_URL,
    AUTH_SECRET: envSrc.AUTH_SECRET,
    AUTH_URL: envSrc.AUTH_URL ?? envSrc.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: envSrc.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: envSrc.GOOGLE_CLIENT_SECRET,
    LINKEDIN_CLIENT_ID: envSrc.LINKEDIN_CLIENT_ID,
    LINKEDIN_CLIENT_SECRET: envSrc.LINKEDIN_CLIENT_SECRET,
    INSTAGRAM_CLIENT_ID: envSrc.INSTAGRAM_CLIENT_ID,
    INSTAGRAM_CLIENT_SECRET: envSrc.INSTAGRAM_CLIENT_SECRET,
    RESEND_API_KEY: envSrc.RESEND_API_KEY,
    EMAIL_FROM: envSrc.EMAIL_FROM,
    ADMIN_ORDER_NOTIFICATION_EMAIL: envSrc.ADMIN_ORDER_NOTIFICATION_EMAIL,
    CRON_SECRET: envSrc.CRON_SECRET,
    DEV_PAYMENT_SIMULATE: envSrc.DEV_PAYMENT_SIMULATE as "0" | "1" | undefined,
    CRYPTO_WEBHOOK_SECRET: envSrc.CRYPTO_WEBHOOK_SECRET,
    NEXT_PUBLIC_SITE_URL: envSrc.NEXT_PUBLIC_SITE_URL,
    PAYMENTO_API_KEY: envSrc.PAYMENTO_API_KEY,
    PAYMENTO_SECRET_KEY: envSrc.PAYMENTO_SECRET_KEY,
    PAYMENTO_SPEED: envSrc.PAYMENTO_SPEED as "0" | "1" | undefined,
    PAYMENTO_API_BASE: envSrc.PAYMENTO_API_BASE,
    PAYMENTO_GATEWAY_BASE: envSrc.PAYMENTO_GATEWAY_BASE,
    CRYPTO_PROVIDER: envSrc.CRYPTO_PROVIDER as "paymento" | undefined,
    PEPTIDEPAY_API_KEY: envSrc.PEPTIDEPAY_API_KEY,
    PEPTIDEPAY_WEBHOOK_SECRET: envSrc.PEPTIDEPAY_WEBHOOK_SECRET ?? envSrc.QIST_WEBHOOK_SECRET,
    PEPTIDEPAY_API_BASE: envSrc.PEPTIDEPAY_API_BASE,
    SOCIAL_PROOF_DEMO_JSON: envSrc.SOCIAL_PROOF_DEMO_JSON,
    SOCIAL_PROOF_WINDOW_DAYS: envSrc.SOCIAL_PROOF_WINDOW_DAYS,
    GOOGLE_SITE_VERIFICATION: emptyToUndef(envSrc.GOOGLE_SITE_VERIFICATION),
  };
  return serverSchema.parse(s);
}

export const env = (() => {
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return process.env as unknown as z.infer<typeof serverSchema>;
  }
  return parse();
})();
