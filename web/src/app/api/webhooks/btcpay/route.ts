import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getBtcpaySignatureHeader, processBtcpayWebhook, verifyBtcpayWebhook, type BtcpayWebhookPayload } from "@/lib/payments/btcpay";

/**
 * BTCPay store webhook: raw JSON body + BTCPAY-SIG HMAC (sha256=…).
 * Register in BTCPay: Store → Settings → Webhooks → https://yourdomain.com/api/webhooks/btcpay
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = env.BTCPAY_WEBHOOK_SECRET;
  const sig = getBtcpaySignatureHeader(req.headers);

  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 501 });
  }
  if (!verifyBtcpayWebhook(raw, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: BtcpayWebhookPayload;
  try {
    payload = JSON.parse(raw) as BtcpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.type) {
    return NextResponse.json({ error: "Missing event type" }, { status: 400 });
  }

  try {
    const r = await processBtcpayWebhook(raw, payload);
    if (r.status === 400) {
      return NextResponse.json({ error: r.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[btcpay] webhook processing failed", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
