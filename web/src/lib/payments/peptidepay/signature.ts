import { createHmac, timingSafeEqual } from "node:crypto";

const SIG_HEADER = "x-peptidepay-signature";

/**
 * PeptidePay webhook header: `t=<unix_seconds>,v1=<hex HMAC-SHA256>`
 * HMAC payload is `${t}.${rawBody}` with the `whsec_…` secret.
 */
export function getPeptidePaySignatureHeader(headers: Headers): string | null {
  return headers.get(SIG_HEADER);
}

export function verifyPeptidePayWebhook(
  rawBody: string,
  receivedSignature: string | null,
  secret: string,
): boolean {
  if (!receivedSignature?.trim() || !secret) return false;

  const [tPart, v1Part] = receivedSignature.trim().split(",");
  const t = tPart?.split("=")[1];
  const v1 = v1Part?.split("=")[1];
  if (!t || !v1) return false;

  const ts = Number(t);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const expectedHex = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  try {
    const expected = Buffer.from(expectedHex, "hex");
    const received = Buffer.from(v1, "hex");
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}
