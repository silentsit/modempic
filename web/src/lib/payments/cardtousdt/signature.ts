import { createHmac } from "node:crypto";

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export function cardToUsdtCanonicalString(params: {
  timestamp: string;
  txidOut: string;
  valueCoin: string;
  coin: string;
}): string {
  return ["c2t1", params.timestamp, params.txidOut, params.valueCoin, params.coin].join("\n");
}

/**
 * CardToUSDT signs with HMAC-SHA256 of the canonical string.
 * Key is the `webhook_secret` string exactly as returned, including any `whsec_` prefix.
 * `c2t_sig` is a comma-separated list of `v1=<hex>` entries — iterate, do not compare the whole header.
 */
export function verifyCardToUsdtSignature(params: {
  webhookSecret: string;
  timestamp: string;
  signature: string;
  txidOut: string;
  valueCoin: string;
  coin: string;
}): boolean {
  const secret = params.webhookSecret;
  if (!secret || !params.timestamp || !params.signature) return false;
  const expected = createHmac("sha256", secret)
    .update(cardToUsdtCanonicalString(params), "utf8")
    .digest("hex")
    .toLowerCase();

  for (const candidate of params.signature.split(",")) {
    const trimmed = candidate.trim();
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const version = trimmed.slice(0, eq);
    const hex = trimmed.slice(eq + 1).toLowerCase();
    if (version === "v1" && hex.length === expected.length && timingSafeEqualHex(expected, hex)) {
      return true;
    }
  }
  return false;
}

export function cardToUsdtSignatureHeader(headers: Headers): string {
  return headers.get("x-c2t-signature") ?? "";
}

export function cardToUsdtTimestampHeader(headers: Headers): string {
  return headers.get("x-c2t-timestamp") ?? "";
}
