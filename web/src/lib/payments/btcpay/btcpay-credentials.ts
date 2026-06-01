/** Strip quotes/whitespace and accidental `token ` prefix from pasted API keys. */
export function normalizeBtcpayApiKey(raw: string | undefined): string | null {
  if (!raw) return null;
  let key = raw.trim().replace(/^['"]|['"]$/g, "");
  if (/^token\s+/i.test(key)) {
    key = key.replace(/^token\s+/i, "").trim();
  }
  return key || null;
}

/** Store ID as shown in BTCPay store settings (no extra quotes). */
export function normalizeBtcpayStoreId(raw: string | undefined): string | null {
  if (!raw) return null;
  const id = raw.trim().replace(/^['"]|['"]$/g, "");
  return id || null;
}
