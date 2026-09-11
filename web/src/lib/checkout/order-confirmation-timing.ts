import type { CryptoCheckoutProvider } from "@/lib/payments/crypto-provider";

export type CheckoutPaymentMethod = "CRYPTO" | "CARD_ONRAMP" | "MANUAL_INVOICE";

/** CardToUSDT and Paymento: confirmation emails wait until payment is verified. */
export function defersOrderConfirmationUntilPayment(params: {
  paymentMethod: CheckoutPaymentMethod;
  cryptoProvider: CryptoCheckoutProvider | null;
}): boolean {
  if (params.paymentMethod === "MANUAL_INVOICE") return false;
  if (params.paymentMethod === "CARD_ONRAMP") return true;
  if (params.paymentMethod === "CRYPTO" && params.cryptoProvider === "paymento") return true;
  return false;
}
