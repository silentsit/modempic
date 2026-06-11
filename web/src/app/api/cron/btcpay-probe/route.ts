import { env } from "@/lib/env";
import {
  btcpayCreateInvoice,
  getBtcpayPublicUrl,
  isBtcpayConfigured,
} from "@/lib/payments/btcpay/client";
import { normalizeBtcpayServerUrl } from "@/lib/payments/btcpay/btcpay-url";

export const maxDuration = 30;

function authorizeCron(request: Request): boolean {
  const cronSecret = env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader === `Bearer ${cronSecret}`;
}

async function run() {
  const publicUrl = getBtcpayPublicUrl();
  const serverUrl = env.BTCPAY_URL ? normalizeBtcpayServerUrl(env.BTCPAY_URL) : null;

  const report: Record<string, unknown> = {
    configured: isBtcpayConfigured(),
    serverHost: serverUrl ? new URL(serverUrl).hostname : null,
    publicHost: publicUrl ? new URL(publicUrl).hostname : null,
    steps: {} as Record<string, unknown>,
  };

  if (!isBtcpayConfigured()) {
    return Response.json({ ok: false, ...report, error: "BTCPay is not configured" }, { status: 503 });
  }

  if (publicUrl) {
    try {
      const modal = await fetch(`${publicUrl}/modal/btcpay.js`, {
        method: "GET",
        signal: AbortSignal.timeout(20_000),
      });
      (report.steps as Record<string, unknown>).modalScript = { ok: modal.ok, status: modal.status };
    } catch (e) {
      (report.steps as Record<string, unknown>).modalScript = {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  const orderNumber = `PROBE-${Date.now()}`;
  const site = env.NEXT_PUBLIC_SITE_URL ?? "https://modempic.com";
  const inv = await btcpayCreateInvoice({
    amountUsd: 1,
    orderNumber,
    redirectUrl: `${site}/checkout`,
    buyerEmail: "btcpay-probe@modempic.internal",
  });

  if (!inv.success) {
    (report.steps as Record<string, unknown>).createInvoice = { ok: false, error: inv.error };
    return Response.json({ ok: false, ...report }, { status: 502 });
  }

  (report.steps as Record<string, unknown>).createInvoice = {
    ok: true,
    invoiceId: inv.invoice.id,
    status: inv.invoice.status ?? "New",
    checkoutHost: (() => {
      try {
        return new URL(inv.invoice.checkoutLink).hostname;
      } catch {
        return null;
      }
    })(),
    orderNumber,
  };

  return Response.json({ ok: true, ...report });
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return run();
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return run();
}
