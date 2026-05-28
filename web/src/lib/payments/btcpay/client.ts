import { env } from "@/lib/env";

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
  return raw.replace(/\/$/, "");
}

/** Public BTCPay URL for loading modal/btcpay.js (client-safe prop from server). */
export function getBtcpayPublicUrl(): string | null {
  const fromPublic = env.NEXT_PUBLIC_BTCPAY_URL?.trim();
  if (fromPublic) return fromPublic.replace(/\/$/, "");
  return btcpayBaseUrl();
}

export function isBtcpayConfigured(): boolean {
  return Boolean(btcpayBaseUrl() && env.BTCPAY_API_KEY && env.BTCPAY_STORE_ID);
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

  try {
    const res = await fetch(`${base}/api/v1/stores/${encodeURIComponent(storeId)}/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as BtcpayInvoice & { message?: string; code?: string };
    if (!res.ok) {
      return { success: false, error: data.message ?? data.code ?? res.statusText };
    }
    if (!data.id || !data.checkoutLink) {
      return { success: false, error: "Invalid BTCPay invoice response" };
    }
    return { success: true, invoice: data };
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
        headers: { Authorization: `token ${apiKey}` },
        next: { revalidate: 0 },
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as BtcpayInvoice;
  } catch {
    return null;
  }
}
