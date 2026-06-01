import { CryptoAsset } from "@prisma/client";
import { env } from "@/lib/env";
import { isBtcpayConfigured } from "@/lib/payments/btcpay/client";
import { isPaymentoConfigured } from "@/lib/payments/paymento";
import { acceptedCheckoutCryptoAssets } from "@/lib/payments/accepted-crypto-assets";

export type CryptoCheckoutProvider = "btcpay" | "paymento" | "sim";

/** Assets routed through BTCPay (on-chain / Lightning). */
export const BTCPAY_CHECKOUT_ASSETS: CryptoAsset[] = [CryptoAsset.BTC];

function allowCryptoSimulator(): boolean {
  return process.env.DEV_PAYMENT_SIMULATE === "1" || process.env.NODE_ENV === "development";
}

function isBtcpayRoutedAsset(asset: CryptoAsset): boolean {
  return BTCPAY_CHECKOUT_ASSETS.includes(asset);
}

function forcedCryptoProviderOverride(): "btcpay" | "paymento" | undefined {
  const raw = env.CRYPTO_PROVIDER?.trim();
  if (raw === "btcpay" || raw === "paymento") return raw;
  return undefined;
}

/** Resolve which gateway handles checkout for a specific asset. */
export function resolveCryptoCheckoutProviderForAsset(asset: CryptoAsset): CryptoCheckoutProvider | null {
  const pref = forcedCryptoProviderOverride();

  if (pref === "btcpay") {
    return isBtcpayConfigured() ? "btcpay" : null;
  }
  if (pref === "paymento") {
    return isPaymentoConfigured() ? "paymento" : null;
  }

  if (isBtcpayRoutedAsset(asset)) {
    if (isBtcpayConfigured()) return "btcpay";
    return null;
  }

  if (isPaymentoConfigured()) return "paymento";
  if (allowCryptoSimulator()) return "sim";
  return null;
}

export function getAvailableCheckoutCryptoAssets(): CryptoAsset[] {
  return acceptedCheckoutCryptoAssets().filter((asset) => resolveCryptoCheckoutProviderForAsset(asset) !== null);
}

export function cryptoCheckoutMisconfigMessageForAsset(asset: CryptoAsset): string {
  const pref = forcedCryptoProviderOverride();

  if (pref === "btcpay" && !isBtcpayConfigured()) {
    return (
      "Bitcoin checkout requires BTCPay configuration (BTCPAY_URL, BTCPAY_API_KEY, BTCPAY_STORE_ID, BTCPAY_WEBHOOK_SECRET)."
    );
  }
  if (pref === "paymento" && !isPaymentoConfigured()) {
    return "This asset requires Paymento configuration (PAYMENTO_API_KEY and PAYMENTO_SECRET_KEY).";
  }

  if (isBtcpayRoutedAsset(asset)) {
    return (
      "Bitcoin checkout requires BTCPay (BTCPAY_URL, BTCPAY_API_KEY, BTCPAY_STORE_ID, BTCPAY_WEBHOOK_SECRET). " +
      "Configure BTCPay or choose a different asset."
    );
  }

  return (
    "This asset requires Paymento (PAYMENTO_API_KEY and PAYMENTO_SECRET_KEY). " +
    "Configure Paymento or choose Bitcoin if BTCPay is available."
  );
}

/** Coarse check: crypto checkout is enabled if any accepted asset has a provider. */
export function resolveCryptoCheckoutProvider(): CryptoCheckoutProvider | null {
  const available = getAvailableCheckoutCryptoAssets();
  if (available.length === 0) {
    if (allowCryptoSimulator()) return "sim";
    return null;
  }
  return resolveCryptoCheckoutProviderForAsset(available[0]!);
}

export function cryptoCheckoutMisconfigMessage(): string {
  return (
    "Crypto checkout is not available: configure BTCPay for Bitcoin (BTCPAY_URL, BTCPAY_API_KEY, BTCPAY_STORE_ID, BTCPAY_WEBHOOK_SECRET), " +
    "and Paymento for other assets (PAYMENTO_API_KEY and PAYMENTO_SECRET_KEY), or use development mode for the built-in simulator."
  );
}
