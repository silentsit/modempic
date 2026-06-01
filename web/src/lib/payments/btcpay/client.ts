import { env } from "@/lib/env";
import { normalizeBtcpayApiKey, normalizeBtcpayStoreId } from "./btcpay-credentials";
import { normalizeBtcpayServerUrl } from "./btcpay-url";

export { normalizeBtcpayServerUrl } from "./btcpay-url";

export type BtcpayInvoice = {
  id: string;
  checkoutLink: string;
  amount: string;
  currency: string;
  status?: string;
  expirationTime?: number;
  metadata?: Record<string, string>;
};

export type BtcpayCreateInvoiceInput = {
  amountUsd: number;
  orderNumber: string;
  redirectUrl: string;
  buyerEmail?: string;
};

export type BtcpayCreateInvoiceResult =
  | { success: true; invoice: BtcpayInvoice }
  | { success: false; error: string };

function btcpayBaseUrl(): string | null {
  const raw = env.BTCPAY_URL?.trim();
  if (!raw) return null;
  return normalizeBtcpayServerUrl(raw);
}

/** Public BTCPay URL for loading modal/btcpay.js (browser). */
export function getBtcpayPublicUrl(): string | null {
  const fromPublic = env.NEXT_PUBLIC_BTCPAY_URL?.trim();
  if (fromPublic) return normalizeBtcpayServerUrl(fromPublic);
  return btcpayBaseUrl();
}

export function isBtcpayConfigured(): boolean {
  return Boolean(
    btcpayBaseUrl() && normalizeBtcpayApiKey(env.BTCPAY_API_KEY) && normalizeBtcpayStoreId(env.BTCPAY_STORE_ID),
  );
}

function btcpayAuthHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `token ${apiKey}`,
    "User-Agent": "Modempic-Storefront/1.0",
  };
}

function responseErrorHint(status: number, isHtml: boolean): string {
  if (status === 401) {
    return "BTCPay rejected the API key (HTTP 401). Regenerate BTCPAY_API_KEY with invoice permissions for this store.";
  }
  if (status === 403) {
    if (isHtml) {
      return (
        "BTCPay returned HTTP 403 (forbidden) as a web page — usually Cloudflare or a firewall blocking Vercel. " +
        "Fix: set BTCPAY_URL to your LunaNode server URL/IP for API calls (bypass Cloudflare), or set the pay subdomain to DNS only (grey cloud off). " +
        "Also confirm BTCPAY_API_KEY has create/view/modify invoice permissions and BTCPAY_STORE_ID matches the store."
      );
    }
    return (
      "BTCPay returned HTTP 403. The API key may lack permissions for this store, or BTCPAY_STORE_ID is wrong. " +
      "Recreate the key scoped to your store with invoice + webhook permissions."
    );
  }
  if (isHtml) {
    return (
      `BTCPay returned a web page (HTTP ${status}) instead of API JSON. ` +
      "Set BTCPAY_URL to the BTCPay server root only (e.g. https://pay.yourdomain.com or https://YOUR-SERVER-IP), not modempic.com."
    );
  }
  return `BTCPay request failed (HTTP ${status}). Check BTCPAY_URL, API key, and store ID.`;
}

async function parseBtcpayApiJson<T extends Record<string, unknown>>(
  res: Response,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: `BTCPay returned an empty response (HTTP ${res.status}).` };
  }

  const isHtml = trimmed.startsWith("<") || trimmed.toLowerCase().includes("<!doctype");

  if (!isHtml) {
    try {
      const data = JSON.parse(trimmed) as T;
      if (!res.ok) {
        const apiMsg =
          (typeof data.message === "string" && data.message) ||
          (typeof data.code === "string" && data.code) ||
          null;
        return {
          ok: false,
          error: apiMsg ? `BTCPay: ${apiMsg}` : responseErrorHint(res.status, false),
        };
      }
      return { ok: true, data };
    } catch {
      return { ok: false, error: responseErrorHint(res.status, false) };
    }
  }

  return { ok: false, error: responseErrorHint(res.status, true) };
}

const BTCPAY_FETCH_TIMEOUT_MS = 25_000;

function formatFetchError(e: unknown, baseUrl: string): string {
  const host = baseUrl.replace(/^https?:\/\//, "").split("/")[0] ?? baseUrl;
  let detail = "";
  if (e instanceof Error) {
    const cause = e.cause;
    if (cause instanceof Error && cause.message) {
      detail = cause.message;
    } else if (cause && typeof cause === "object" && "code" in cause) {
      detail = String((cause as { code?: string }).code);
    } else if (e.message !== "fetch failed") {
      detail = e.message;
    }
  }
  const suffix = detail ? ` (${detail})` : "";
  return (
    `Could not connect to BTCPay at ${host}${suffix}. ` +
    "Confirm https://btcpay.modempic.com opens in your browser, LunaNode allows inbound HTTPS (port 443), " +
    "and Vercel Production has BTCPAY_URL=https://btcpay.modempic.com — then redeploy."
  );
}

function invoiceFromPayload(data: Record<string, unknown>): BtcpayInvoice | null {
  const id = typeof data.id === "string" ? data.id : null;
  const checkoutLink = typeof data.checkoutLink === "string" ? data.checkoutLink : null;
  if (!id || !checkoutLink) return null;
  return {
    id,
    checkoutLink,
    amount: String(data.amount ?? ""),
    currency: String(data.currency ?? ""),
    status: typeof data.status === "string" ? data.status : undefined,
    expirationTime: typeof data.expirationTime === "number" ? data.expirationTime : undefined,
    metadata:
      data.metadata && typeof data.metadata === "object"
        ? (data.metadata as Record<string, string>)
        : undefined,
  };
}

export async function btcpayCreateInvoice(input: BtcpayCreateInvoiceInput): Promise<BtcpayCreateInvoiceResult> {
  const base = btcpayBaseUrl();
  const apiKey = normalizeBtcpayApiKey(env.BTCPAY_API_KEY);
  const storeId = normalizeBtcpayStoreId(env.BTCPAY_STORE_ID);
  if (!base || !apiKey || !storeId) {
    return { success: false, error: "BTCPay is not configured" };
  }

  const body: Record<string, unknown> = {
    amount: input.amountUsd,
    currency: "USD",
    metadata: {
      orderId: input.orderNumber,
    },
    checkout: {
      redirectURL: input.redirectUrl,
      redirectAutomatically: true,
    },
  };
  if (input.buyerEmail) {
    body.buyer = { email: input.buyerEmail };
  }

  const invoiceUrl = `${base}/api/v1/stores/${encodeURIComponent(storeId)}/invoices`;

  try {
    const res = await fetch(invoiceUrl, {
      method: "POST",
      headers: btcpayAuthHeaders(apiKey),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(BTCPAY_FETCH_TIMEOUT_MS),
    });

    const parsed = await parseBtcpayApiJson<Record<string, unknown>>(res);
    if (!parsed.ok) {
      console.error("[btcpay] create invoice failed", {
        status: res.status,
        url: invoiceUrl,
        storeIdLength: storeId.length,
        error: parsed.error,
      });
      return { success: false, error: parsed.error };
    }

    const invoice = invoiceFromPayload(parsed.data);
    if (!invoice) {
      return { success: false, error: "Invalid BTCPay invoice response (missing id or checkoutLink)." };
    }
    return { success: true, invoice };
  } catch (e) {
    console.error("[btcpay] create invoice network error", { url: invoiceUrl, error: e });
    return { success: false, error: formatFetchError(e, base) };
  }
}

export async function btcpayGetInvoice(invoiceId: string): Promise<BtcpayInvoice | null> {
  const base = btcpayBaseUrl();
  const apiKey = normalizeBtcpayApiKey(env.BTCPAY_API_KEY);
  const storeId = normalizeBtcpayStoreId(env.BTCPAY_STORE_ID);
  if (!base || !apiKey || !storeId) return null;

  try {
    const res = await fetch(
      `${base}/api/v1/stores/${encodeURIComponent(storeId)}/invoices/${encodeURIComponent(invoiceId)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `token ${apiKey}`,
          "User-Agent": "Modempic-Storefront/1.0",
        },
        next: { revalidate: 0 },
      },
    );
    const parsed = await parseBtcpayApiJson<Record<string, unknown>>(res);
    if (!parsed.ok || !res.ok) return null;
    return invoiceFromPayload(parsed.data);
  } catch {
    return null;
  }
}
