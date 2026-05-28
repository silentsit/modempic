import { env } from "@/lib/env";
import { isBtcpayConfigured } from "@/lib/payments/btcpay/client";
import { isPaymentoConfigured } from "@/lib/payments/paymento";

export type CryptoCheckoutProvider = "btcpay" | "paymento" | "sim";

function allowCryptoSimulator(): boolean {
  return process.env.DEV_PAYMENT_SIMULATE === "1" || process.env.NODE_ENV === "development";
}

/** Which crypto gateway handles checkout (BTCPay preferred when both are configured). */
export function resolveCryptoCheckoutProvider(): CryptoCheckoutProvider | null {
  const pref = env.CRYPTO_PROVIDER;

  if (pref === "btcpay") {
    return isBtcpayConfigured() ? "btcpay" : null;
  }
  if (pref === "paymento") {
    return isPaymentoConfigured() ? "paymento" : null;
  }

  if (isBtcpayConfigured()) return "btcpay";
  if (isPaymentoConfigured()) return "paymento";
  if (allowCryptoSimulator()) return "sim";
  return null;
}

export function cryptoCheckoutMisconfigMessage(): string {
  return (
    "Crypto checkout is not available: configure BTCPay (BTCPAY_URL, BTCPAY_API_KEY, BTCPAY_STORE_ID, BTCPAY_WEBHOOK_SECRET), " +
    "or Paymento (PAYMENTO_API_KEY and PAYMENTO_SECRET_KEY), or use development mode for the built-in simulator."
  );
}
