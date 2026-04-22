import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processPaymentoIpn, type PaymentoIpnPayload } from "@/lib/payments/paymento";
import { verifyPaymentoHmac } from "@/lib/payments/paymento/signature";

/**
 * Paymento IPN: raw JSON + `X-HMAC-SHA256-SIGNATURE` (HMAC of body, uppercase hex).
 * @see https://docs.paymento.io
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = env.PAYMENTO_SECRET_KEY;
  const sig =
    req.headers.get("x-hmac-sha256-signature") ??
    req.headers.get("X-HMAC-SHA256-SIGNATURE");
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

  const r = await processPaymentoIpn(raw, payload);
  if (r.status === 400) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
