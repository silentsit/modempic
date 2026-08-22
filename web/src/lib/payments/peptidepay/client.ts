import { env } from "@/lib/env";

const DEFAULT_API = "https://pay.qistdigital.com";

function apiBase() {
  return (env.PEPTIDEPAY_API_BASE ?? DEFAULT_API).replace(/\/$/, "");
}

export function isPeptidePayConfigured(): boolean {
  return Boolean(env.PEPTIDEPAY_API_KEY && env.PEPTIDEPAY_WEBHOOK_SECRET);
}

export type PeptidePayCheckoutInitInput = {
  amountCents: number;
  currency: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
  webhookUrl: string;
  orderId: string;
  productDescriptor?: string;
  idempotencyKey: string;
};

export type PeptidePayCheckoutInitResult =
  | { success: true; id: string; url: string }
  | { success: false; error: string };

type CheckoutInitResponse = {
  id?: string;
  url?: string;
  error?: string;
  message?: string;
};

export async function peptidePayCreateCheckoutSession(
  input: PeptidePayCheckoutInitInput,
): Promise<PeptidePayCheckoutInitResult> {
  const key = env.PEPTIDEPAY_API_KEY;
  if (!key) {
    return { success: false, error: "PEPTIDEPAY_API_KEY is not configured" };
  }

  const res = await fetch(`${apiBase()}/api/v1/checkout/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      amount_cents: input.amountCents,
      currency: input.currency,
      ...(input.email ? { email: input.email } : {}),
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      webhook_url: input.webhookUrl,
      ...(input.productDescriptor ? { product_name: input.productDescriptor.slice(0, 80) } : {}),
      metadata: { order_id: input.orderId },
    }),
  });

  let data: CheckoutInitResponse = {};
  try {
    data = (await res.json()) as CheckoutInitResponse;
  } catch {
    return { success: false, error: `PeptidePay returned HTTP ${res.status}` };
  }

  if (!res.ok) {
    return { success: false, error: data.error ?? data.message ?? `PeptidePay HTTP ${res.status}` };
  }
  if (typeof data.id === "string" && data.id && typeof data.url === "string" && data.url) {
    return { success: true, id: data.id, url: data.url };
  }
  return { success: false, error: data.error ?? data.message ?? "Invalid PeptidePay checkout response" };
}

export async function peptidePayGetSession(sessionId: string): Promise<{
  ok: boolean;
  status?: string;
  orderId?: string;
  raw: unknown;
}> {
  const key = env.PEPTIDEPAY_API_KEY;
  if (!key) {
    return { ok: false, raw: { error: "no api key" } };
  }

  const res = await fetch(`${apiBase()}/api/v1/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data = (await res.json()) as { status?: string; metadata?: { order_id?: string }; error?: string };
  if (!res.ok) {
    return { ok: false, raw: data };
  }
  return {
    ok: true,
    status: data.status,
    orderId: data.metadata?.order_id,
    raw: data,
  };
}
