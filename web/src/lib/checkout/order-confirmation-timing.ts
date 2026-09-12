import type { CryptoCheckoutProvider } from "@/lib/payments/crypto-provider";

export type CheckoutPaymentMethod = "CRYPTO" | "CARD_ONRAMP" | "MANUAL_INVOICE";

/** CardToUSDT and crypto: confirmation emails wait until payment is fully complete. */
export function defersOrderConfirmationUntilPayment(params: {
  paymentMethod: CheckoutPaymentMethod;
  cryptoProvider: CryptoCheckoutProvider | null;
}): boolean {
  void params.cryptoProvider;
  if (params.paymentMethod === "MANUAL_INVOICE") return false;
  if (params.paymentMethod === "CARD_ONRAMP") return true;
  if (params.paymentMethod === "CRYPTO") return true;
  return false;
}
