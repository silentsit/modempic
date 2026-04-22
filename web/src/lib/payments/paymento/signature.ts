import { createHmac } from "node:crypto";

/**
 * Verify Paymento IPN: raw JSON body + secret → HMAC-SHA256 hex uppercase, compare to header.
 * @see https://docs.paymento.io — X-HMAC-SHA256-SIGNATURE
 */
export function verifyPaymentoHmac(rawBody: string, receivedSignature: string | null, secretKey: string): boolean {
  if (!receivedSignature) return false;
  const calculated = createHmac("sha256", secretKey).update(rawBody, "utf8").digest("hex").toUpperCase();
  const expected = receivedSignature.trim();
  if (calculated.length !== expected.length) return false;
  return timingSafeEqualHex(calculated, expected);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}
