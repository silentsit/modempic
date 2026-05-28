import { createHmac, timingSafeEqual } from "node:crypto";

const SIG_HEADER = "btcpay-sig";

/**
 * BTCPay webhook signature: header `BTCPAY-SIG` = `sha256=` + HMAC-SHA256(raw body, webhook secret).
 * @see https://docs.btcpayserver.org/Development/GreenFieldExample-NodeJS/
 */
export function getBtcpaySignatureHeader(headers: Headers): string | null {
  return headers.get(SIG_HEADER) ?? headers.get("BTCPAY-SIG");
}

export function verifyBtcpayWebhook(rawBody: Buffer | string, receivedSignature: string | null, secret: string): boolean {
  if (!receivedSignature?.trim()) return false;

  const body = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
  const digestHex = createHmac("sha256", secret).update(body).digest("hex");
  const expected = Buffer.from(`sha256=${digestHex}`, "utf8");
  const received = Buffer.from(receivedSignature.trim(), "utf8");

  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
