import { env } from "@/lib/env";
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

/** BTCPay server root only — strips paths like /stores/... from pasted URLs. */
function btcpayBaseUrl(): string | null {
  const raw = env.BTCPAY_URL?.trim();
  if (!raw) return null;
  return normalizeBtcpayServerUrl(raw);
}

/** Public BTCPay URL for loading modal/btcpay.js (client-safe prop from server). */
export function getBtcpayPublicUrl(): string | null {
  const fromPublic = env.NEXT_PUBLIC_BTCPAY_URL?.trim();
  if (fromPublic) return normalizeBtcpayServerUrl(fromPublic);
  return btcpayBaseUrl();
}

export function isBtcpayConfigured(): boolean {
  return Boolean(btcpayBaseUrl() && env.BTCPAY_API_KEY && env.BTCPAY_STORE_ID);
}

function htmlResponseHint(status: number): string {
  return (
    `BTCPay returned a web page (HTTP ${status}) instead of API JSON. ` +
    "Set BTCPAY_URL to your BTCPay server root only (e.g. https://pay.yourdomain.com), not the Modempic store URL. " +
    "Confirm HTTPS works, the API key has invoice permissions for that store, and BTCPAY_STORE_ID matches the store."
  );
}

async function parseBtcpayApiJson<T extends Record<string, unknown>>(
  res: Response,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: `BTCPay returned an empty response (HTTP ${res.status}).` };
  }
  if (trimmed.startsWith("<") || trimmed.toLowerCase().includes("<!doctype")) {
    return { ok: false, error: htmlResponseHint(res.status) };
  }
  try {
    const data = JSON.parse(trimmed) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      error: `BTCPay returned invalid JSON (HTTP ${res.status}). Check BTCPAY_URL and API credentials.`,
    };
  }
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
  const apiKey = env.BTCPAY_API_KEY;
  const storeId = env.BTCPAY_STORE_ID;
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
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `token ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const parsed = await parseBtcpayApiJson<Record<string, unknown>>(res);
    if (!parsed.ok) {
      console.error("[btcpay] create invoice failed", { status: res.status, url: invoiceUrl, error: parsed.error });
      return { success: false, error: parsed.error };
    }

    const data = parsed.data;
    if (!res.ok) {
      const msg =
        (typeof data.message === "string" && data.message) ||
        (typeof data.code === "string" && data.code) ||
        res.statusText;
      return { success: false, error: msg };
    }

    const invoice = invoiceFromPayload(data);
    if (!invoice) {
      return { success: false, error: "Invalid BTCPay invoice response (missing id or checkoutLink)." };
    }
    return { success: true, invoice };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "BTCPay request failed";
    return { success: false, error: msg };
  }
}

export async function btcpayGetInvoice(invoiceId: string): Promise<BtcpayInvoice | null> {
  const base = btcpayBaseUrl();
  const apiKey = env.BTCPAY_API_KEY;
  const storeId = env.BTCPAY_STORE_ID;
  if (!base || !apiKey || !storeId) return null;

  try {
    const res = await fetch(
      `${base}/api/v1/stores/${encodeURIComponent(storeId)}/invoices/${encodeURIComponent(invoiceId)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `token ${apiKey}`,
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
