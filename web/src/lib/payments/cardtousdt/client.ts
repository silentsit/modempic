import { cardToUsdtApiBase, isSafeCardToUsdtCheckoutUrl } from "./config";
import type { CardToUsdtCreateInput, CardToUsdtCreateResult } from "./types";

type CreateJson = {
  checkout_url?: unknown;
  deposit_address?: unknown;
  amount?: unknown;
  currency?: unknown;
  amount_usd?: unknown;
  order_id?: unknown;
  webhook_secret?: unknown;
  created_at?: unknown;
  error?: { code?: unknown; message?: unknown; request_id?: unknown };
  request_id?: unknown;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function cardToUsdtCreateCheckout(input: CardToUsdtCreateInput): Promise<CardToUsdtCreateResult> {
  const url = `${cardToUsdtApiBase()}/v2/checkout`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payout_address: input.payoutAddress,
        amount: input.amount,
        currency: input.currency,
        buyer_email: input.buyerEmail,
        order_id: input.orderId,
        webhook_url: input.webhookUrl,
      }),
      cache: "no-store",
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "CardToUSDT network error",
      code: "network_error",
      retryable: true,
      requestId: null,
    };
  }

  const requestId = res.headers.get("x-request-id");
  let data: CreateJson = {};
  try {
    data = (await res.json()) as CreateJson;
  } catch {
    return {
      ok: false,
      error: `CardToUSDT returned ${res.status} with a non-JSON body`,
      code: "invalid_json",
      retryable: false,
      requestId,
    };
  }

  const errorCode = asString(data.error?.code);
  const errorMessage = asString(data.error?.message) ?? asString(data.error?.request_id);
  const errorRequestId = asString(data.error?.request_id) ?? asString(data.request_id) ?? requestId;

  if (!res.ok || errorCode) {
    return {
      ok: false,
      error: errorMessage ?? `CardToUSDT create failed (${res.status})`,
      code: errorCode,
      retryable: errorCode === "conversion_failed",
      requestId: errorRequestId,
    };
  }

  const checkoutUrl = asString(data.checkout_url);
  const amount = asNumber(data.amount);
  const amountUsd = asNumber(data.amount_usd);
  const currency = asString(data.currency);
  const orderId = asString(data.order_id);
  if (
    !checkoutUrl ||
    !isSafeCardToUsdtCheckoutUrl(checkoutUrl) ||
    amount == null ||
    amountUsd == null ||
    !currency ||
    !orderId
  ) {
    return {
      ok: false,
      error: "CardToUSDT create response was missing a safe checkout_url or amount_usd",
      code: "invalid_response",
      retryable: false,
      requestId: errorRequestId,
    };
  }

  return {
    ok: true,
    checkoutUrl,
    depositAddress: asString(data.deposit_address),
    amount,
    currency,
    amountUsd,
    orderId,
    webhookSecret: asString(data.webhook_secret),
    createdAt: asString(data.created_at) ?? new Date().toISOString(),
    requestId: errorRequestId,
  };
}
