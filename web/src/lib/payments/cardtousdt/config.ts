import { createHmac } from "node:crypto";
import { env } from "@/lib/env";
import { getSiteUrl } from "@/lib/site-url";
import { CARDTOUSDT_DEFAULT_FULFILL_BAND, CARDTOUSDT_PROVIDER } from "./types";

const PAYOUT_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function isValidCardToUsdtPayoutAddress(value: string | undefined | null): value is string {
  return Boolean(value && PAYOUT_ADDRESS_RE.test(value.trim()));
}

export function cardToUsdtPayoutAddress(): string | null {
  const raw = env.CARDTOUSDT_PAYOUT_ADDRESS?.trim();
  return isValidCardToUsdtPayoutAddress(raw) ? raw : null;
}

export function cardToUsdtApiBase(): string {
  return (env.CARDTOUSDT_API_BASE ?? "https://api.cardtousdt.to").replace(/\/$/, "");
}

export function cardToUsdtFulfillBand(): number {
  const raw = env.CARDTOUSDT_FULFILL_BAND;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return CARDTOUSDT_DEFAULT_FULFILL_BAND;
  return Math.min(1, Math.max(0.5, raw));
}

function isPublicHttpsHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".local")) {
    return false;
  }
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return false;
  if (host.includes("cardtousdt.to")) return false;
  return host.includes(".");
}

/** Hosted checkout pages we will send a shopper to. Do not rewrite the URL. */
export function isSafeCardToUsdtCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".local")) {
      return false;
    }
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return false;
    return host.includes(".");
  } catch {
    return false;
  }
}

export function isPublicHttpsWebhookOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    return isPublicHttpsHostname(url.hostname);
  } catch {
    return false;
  }
}

export function cardToUsdtWebhookOrigin(): string | null {
  const override = env.CARDTOUSDT_WEBHOOK_BASE_URL?.trim();
  if (override && isPublicHttpsWebhookOrigin(override)) return override.replace(/\/$/, "");
  const site = getSiteUrl();
  if (isPublicHttpsWebhookOrigin(site)) return site.replace(/\/$/, "");
  return null;
}

export function isCardToUsdtConfigured(): boolean {
  return Boolean(cardToUsdtPayoutAddress() && cardToUsdtWebhookOrigin());
}

export function cardToUsdtMisconfigMessage(): string {
  if (!cardToUsdtPayoutAddress()) {
    return "Card checkout is not available: set CARDTOUSDT_PAYOUT_ADDRESS to your 0x payout wallet.";
  }
  if (!cardToUsdtWebhookOrigin()) {
    return (
      "Card checkout is not available: CardToUSDT requires a public HTTPS webhook. " +
      "Set AUTH_URL or NEXT_PUBLIC_SITE_URL to your live origin, or CARDTOUSDT_WEBHOOK_BASE_URL to a tunnel."
    );
  }
  return "Card checkout is not configured.";
}

export function cardToUsdtOurWebhookSecret(orderNumber: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(`c2t:${orderNumber}`).digest("hex").slice(0, 32);
}

export function buildCardToUsdtWebhookUrl(orderNumber: string): string | null {
  const origin = cardToUsdtWebhookOrigin();
  if (!origin) return null;
  const url = new URL("/api/webhooks/cardtousdt", `${origin}/`);
  const orderId = orderNumber.trim().toUpperCase();
  url.searchParams.set("order_id", orderId);
  url.searchParams.set("secret", cardToUsdtOurWebhookSecret(orderId));
  return url.toString();
}

export function cardToUsdtProvider(): typeof CARDTOUSDT_PROVIDER {
  return CARDTOUSDT_PROVIDER;
}
