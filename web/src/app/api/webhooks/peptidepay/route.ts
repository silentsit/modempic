import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  getPeptidePaySignatureHeader,
  processPeptidePayWebhook,
  verifyPeptidePayWebhook,
  type PeptidePayWebhookPayload,
} from "@/lib/payments/peptidepay";

/**
 * PeptidePay HMAC webhook: raw JSON + `x-peptidepay-signature: t=…,v1=…`.
 * Register as webhook_url on checkout/init: https://yourdomain.com/api/webhooks/peptidepay
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = env.PEPTIDEPAY_WEBHOOK_SECRET;
  const sig = getPeptidePaySignatureHeader(req.headers);

  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 501 });
  }
  if (!verifyPeptidePayWebhook(raw, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: PeptidePayWebhookPayload;
  try {
    payload = JSON.parse(raw) as PeptidePayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const r = await processPeptidePayWebhook(raw, payload);
    if (r.status === 400) {
      return NextResponse.json({ error: r.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[peptidepay] webhook processing failed", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
