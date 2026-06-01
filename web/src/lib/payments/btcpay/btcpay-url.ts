/** BTCPay server root only — strips paths like /stores/... from pasted URLs. */
export function normalizeBtcpayServerUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  try {
    const u = new URL(trimmed);
    return u.origin;
  } catch {
    return trimmed;
  }
}
