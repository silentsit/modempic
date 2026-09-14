function normalizedProvider(provider?: string | null): string {
  return provider?.trim().toLowerCase() ?? "";
}

/** Short gateway name for admin and emails. Never surfaces retired BTCPay. */
export function paymentProviderName(provider?: string | null): string {
  const key = normalizedProvider(provider);
  if (key === "manual_invoice") return "Credit/Debit Cards (Visa/MasterCard)";
  if (key === "cardtousdt") return "Card (CardToUSDT)";
  if (key === "paymento") return "Paymento";
  if (key === "crypto_sim") return "Cryptocurrency (test)";
  if (key === "btcpay") return "Cryptocurrency";
  return provider?.trim() || "Payment";
}

/** Staff-facing label for the latest payment on an order. */
export function paymentProviderDisplayLabel(params: {
  provider?: string | null;
  method?: string | null;
  asset?: string | null;
}): string {
  if (normalizedProvider(params.provider) === "manual_invoice") return "Credit/Debit Cards (Visa/MasterCard)";
  if (normalizedProvider(params.provider) === "cardtousdt") return "Card (CardToUSDT)";
  if (normalizedProvider(params.provider) === "btcpay") {
    return params.asset ? `Pay in ${params.asset}` : "Cryptocurrency";
  }
  if (params.method === "CRYPTO") return `Pay in ${params.asset ?? "Crypto"}`;
  if (params.method === "CARD_ONRAMP") return "Debit or credit card";
  if (params.provider?.trim()) return paymentProviderName(params.provider);
  return params.method || "Payment";
}
