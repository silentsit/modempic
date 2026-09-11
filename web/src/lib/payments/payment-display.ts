/** Staff-facing label for the latest payment on an order. */
export function paymentProviderDisplayLabel(params: {
  provider?: string | null;
  method?: string | null;
  asset?: string | null;
}): string {
  if (params.provider === "manual_invoice") return "Credit/Debit Cards (Visa/MasterCard)";
  if (params.provider === "cardtousdt") return "Card (CardToUSDT)";
  if (params.method === "CRYPTO") return `Pay in ${params.asset ?? "Crypto"}`;
  if (params.method === "CARD_ONRAMP") return "Debit or credit card";
  return params.provider || params.method || "Payment";
}
