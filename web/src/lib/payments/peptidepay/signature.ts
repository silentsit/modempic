import { createHmac, timingSafeEqual } from "node:crypto";

const SIG_HEADER = "x-peptidepay-signature";

/**
 * PeptidePay webhook header: `t=<unix_seconds>,v1=<hex HMAC-SHA256>`
 * HMAC payload is `${t}.${rawBody}` with the `whsec_…` secret.
 */
export function getPeptidePaySignatureHeader(headers: Headers): string | null {
  return headers.get(SIG_HEADER);
}

/** Strip dashboard/Vercel paste noise: whitespace and wrapping quotes. */
export function normalizePeptidePayWebhookSecret(secret: string | undefined | null): string {
  return (secret ?? "").trim().replace(/^['"]+|['"]+$/g, "").trim();
}

function parseSignatureHeader(header: string): { t: string; v1: string } | null {
  let t: string | null = null;
  let v1: string | null = null;
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "t") t = value;
    else if (key === "v1") v1 = value.toLowerCase();
  }
  if (!t || !v1) return null;
  return { t, v1 };
}

export function verifyPeptidePayWebhook(
  rawBody: string,
  receivedSignature: string | null,
  secret: string,
): boolean {
  const key = normalizePeptidePayWebhookSecret(secret);
  if (!receivedSignature?.trim() || !key) return false;

  const parsed = parseSignatureHeader(receivedSignature.trim());
  if (!parsed) return false;

  const ts = Number(parsed.t);
  if (!Number.isFinite(ts)) return false;
  const tsSec = ts > 1e12 ? ts / 1000 : ts;
  if (Math.abs(Date.now() / 1000 - tsSec) > 300) return false;

  const signedInput = Buffer.concat([Buffer.from(`${parsed.t}.`, "utf8"), Buffer.from(rawBody, "utf8")]);
  const expectedHex = createHmac("sha256", key).update(signedInput).digest("hex");
  try {
    const expected = Buffer.from(expectedHex, "hex");
    const received = Buffer.from(parsed.v1, "hex");
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}
