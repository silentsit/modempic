import { createHmac } from "node:crypto";

/**
 * Header names Paymento may send (HTTP compares case-insensitively; cURL example uses
 * `HMAC_SHA256_SIGNATURE`). @see https://docs.paymento.io/api-documention/payment-callback.md
 */
const SIGNATURE_HEADER_CANDIDATES = [
  "x-hmac-sha256-signature",
  "hmac_sha256_signature",
] as const;

/**
 * Read the HMAC from the first matching header.
 */
export function getPaymentoIpnSignatureHeader(headers: Headers): string | null {
  for (const name of SIGNATURE_HEADER_CANDIDATES) {
    const v = headers.get(name);
    if (v) return v;
  }
  return null;
}

/**
 * Verify Paymento IPN: raw JSON body + secret → HMAC-SHA256 hex, compare to header (any hex case).
 */
export function verifyPaymentoHmac(rawBody: string, receivedSignature: string | null, secretKey: string): boolean {
  if (!receivedSignature) return false;
  const calculated = createHmac("sha256", secretKey).update(rawBody, "utf8").digest("hex").toUpperCase();
  const expected = receivedSignature.trim().toUpperCase();
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
