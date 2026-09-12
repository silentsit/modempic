import { env } from "@/lib/env";
import { interpretPaymentoVerifyResponse } from "./status";

const DEFAULT_API = "https://api.paymento.io";
const DEFAULT_GATEWAY = "https://app.paymento.io/gateway";

function apiBase() {
  return (env.PAYMENTO_API_BASE ?? DEFAULT_API).replace(/\/$/, "");
}

export function paymentoGatewayUrl(token: string) {
  const base = (env.PAYMENTO_GATEWAY_BASE ?? DEFAULT_GATEWAY).replace(/\/$/, "");
  return `${base}?token=${encodeURIComponent(token)}`;
}

export type PaymentoRequestInput = {
  fiatAmount: string; // e.g. "29.99"
  fiatCurrency: string;
  orderId: string;
  returnUrl: string;
  speed: 0 | 1;
  emailAddress?: string;
  additionalData?: { key: string; value: string }[];
};

export type PaymentoRequestResponse = { success: true; token: string } | { success: false; error: string };

/**
 * POST /v1/payment/request — returns one-time token; redirect to hosted gateway.
 */
export async function paymentoCreatePaymentRequest(input: PaymentoRequestInput): Promise<PaymentoRequestResponse> {
  const key = env.PAYMENTO_API_KEY;
  if (!key) {
    return { success: false, error: "PAYMENTO_API_KEY is not configured" };
  }

  const res = await fetch(`${apiBase()}/v1/payment/request`, {
    method: "POST",
    headers: {
      "Api-key": key,
      "Content-Type": "application/json",
      Accept: "text/plain",
    },
    body: JSON.stringify({
      fiatAmount: input.fiatAmount,
      fiatCurrency: input.fiatCurrency,
      ReturnUrl: input.returnUrl,
      orderId: input.orderId,
      Speed: input.speed,
      RiskSpeed: input.speed,
      ...(input.emailAddress ? { EmailAddress: input.emailAddress } : {}),
      ...(input.additionalData?.length ? { additionalData: input.additionalData } : {}),
    }),
  });

  const data = (await res.json()) as { success?: boolean; body?: string; error?: string; message?: string };
  if (!res.ok) {
    return { success: false, error: data.error ?? data.message ?? res.statusText };
  }
  if (data.success && typeof data.body === "string" && data.body.trim()) {
    return { success: true, token: data.body.trim() };
  }
  return { success: false, error: data.error ?? data.message ?? "Invalid Paymento response" };
}

/**
 * Confirm Paymento status before marking an order paid.
 * `success: false` is normal for Paid (7) until the store verify moves it to Approve (8).
 */
export async function paymentoVerifyToken(token: string): Promise<{
  ok: boolean;
  fullyConfirmed: boolean;
  waitingForConfirmation: boolean;
  invalidToken: boolean;
  orderId?: string;
  orderStatus?: number;
  raw: unknown;
}> {
  const key = env.PAYMENTO_API_KEY;
  if (!key) {
    return {
      ok: false,
      fullyConfirmed: false,
      waitingForConfirmation: false,
      invalidToken: false,
      raw: { error: "no api key" },
    };
  }

  const res = await fetch(`${apiBase()}/v1/payment/verify`, {
    method: "POST",
    headers: {
      "Api-key": key,
      "Content-Type": "application/json",
      Accept: "text/plain",
    },
    body: JSON.stringify({ token }),
  });

  const data: unknown = await res.json();
  const interpreted = interpretPaymentoVerifyResponse(data, res.ok);
  return {
    ok: interpreted.fullyConfirmed,
    ...interpreted,
    raw: data,
  };
}

/** Always wait for required blockchain confirmations. Mempool speed is not used. */
export function getPaymentoSpeedFromEnv(): 1 {
  return 1;
}

export function isPaymentoConfigured(): boolean {
  return Boolean(env.PAYMENTO_API_KEY && env.PAYMENTO_SECRET_KEY);
}
