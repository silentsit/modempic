import { CryptoAsset } from "@prisma/client";
import { env } from "@/lib/env";
import { isBtcpayConfigured } from "@/lib/payments/btcpay/client";
import { isPaymentoConfigured } from "@/lib/payments/paymento";

export type CryptoCheckoutProvider = "btcpay" | "paymento" | "sim";

function allowCryptoSimulator(): boolean {
  return process.env.DEV_PAYMENT_SIMULATE === "1" || process.env.NODE_ENV === "development";
}

/** Legacy: primary provider when asset is not known (prefers BTCPay). */
export function resolveCryptoCheckoutProvider(): CryptoCheckoutProvider | null {
  return resolveCryptoProviderForAsset(CryptoAsset.BTC);
}

/** Route checkout by asset: BTC → BTCPay (if configured), stablecoins/alts → Paymento. */
export function resolveCryptoProviderForAsset(asset: CryptoAsset): CryptoCheckoutProvider | null {
  const pref = env.CRYPTO_PROVIDER;

  if (pref === "btcpay") {
    return isBtcpayConfigured() ? "btcpay" : null;
  }
  if (pref === "paymento") {
    return isPaymentoConfigured() ? "paymento" : null;
  }

  if (asset === CryptoAsset.BTC) {
    if (isBtcpayConfigured()) return "btcpay";
    if (isPaymentoConfigured()) return "paymento";
    if (allowCryptoSimulator()) return "sim";
    return null;
  }

  if (isPaymentoConfigured()) return "paymento";
  if (allowCryptoSimulator()) return "sim";
  return null;
}

/** Assets shown at checkout based on configured gateways. */
export function checkoutCryptoAssets(): CryptoAsset[] {
  const all = Object.values(CryptoAsset);
  if (isPaymentoConfigured()) return all;
  if (isBtcpayConfigured()) return all.filter((a) => a === CryptoAsset.BTC);
  return all;
}

export function cryptoCheckoutMisconfigMessage(): string {
  return (
    "Crypto checkout is not available: configure BTCPay (BTCPAY_URL, BTCPAY_API_KEY, BTCPAY_STORE_ID, BTCPAY_WEBHOOK_SECRET), " +
    "or Paymento (PAYMENTO_API_KEY and PAYMENTO_SECRET_KEY), or use development mode for the built-in simulator."
  );
}

export function cryptoCheckoutMisconfigForAsset(asset: CryptoAsset): string {
  if (asset === CryptoAsset.BTC) {
    return "Bitcoin checkout is not available: configure BTCPay or Paymento, or use development mode for the built-in simulator.";
  }
  return `${asset} checkout requires Paymento (PAYMENTO_API_KEY and PAYMENTO_SECRET_KEY). Configure Paymento or choose Bitcoin at checkout.`;
}

export { isBtcpayConfigured, isPaymentoConfigured };
