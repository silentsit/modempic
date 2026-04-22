import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processPaymentoIpn, type PaymentoIpnPayload } from "@/lib/payments/paymento";
import { getPaymentoIpnSignatureHeader, verifyPaymentoHmac } from "@/lib/payments/paymento/signature";

/**
 * Paymento IPN: raw JSON + HMAC of raw body (hex). Headers per
 * [Payment Callback](https://docs.paymento.io/api-documention/payment-callback.md).
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = env.PAYMENTO_SECRET_KEY;
  const sig = getPaymentoIpnSignatureHeader(req.headers);
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 501 });
  }
  if (!verifyPaymentoHmac(raw, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: PaymentoIpnPayload;
  try {
    payload = JSON.parse(raw) as PaymentoIpnPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.Token == null || payload.PaymentId == null || !payload.OrderId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const r = await processPaymentoIpn(raw, payload);
    if (r.status === 400) {
      return NextResponse.json({ error: r.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[paymento] IPN processing failed", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
