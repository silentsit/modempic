import { CryptoAsset } from "@prisma/client";
import { env } from "@/lib/env";
import { isPaymentoConfigured } from "@/lib/payments/paymento";
import { acceptedCheckoutCryptoAssets } from "@/lib/payments/accepted-crypto-assets";

export type CryptoCheckoutProvider = "paymento" | "sim";

function allowCryptoSimulator(): boolean {
  return process.env.DEV_PAYMENT_SIMULATE === "1" || process.env.NODE_ENV === "development";
}

function forcedCryptoProviderOverride(): "paymento" | undefined {
  const raw = env.CRYPTO_PROVIDER?.trim();
  if (raw === "paymento") return raw;
  return undefined;
}

/** Resolve which gateway handles checkout for a specific asset. All crypto assets use Paymento. */
export function resolveCryptoCheckoutProviderForAsset(asset: CryptoAsset): CryptoCheckoutProvider | null {
  void asset;
  const pref = forcedCryptoProviderOverride();

  if (pref === "paymento") {
    return isPaymentoConfigured() ? "paymento" : null;
  }

  if (isPaymentoConfigured()) return "paymento";
  if (allowCryptoSimulator()) return "sim";
  return null;
}

export function getAvailableCheckoutCryptoAssets(): CryptoAsset[] {
  return acceptedCheckoutCryptoAssets().filter((asset) => resolveCryptoCheckoutProviderForAsset(asset) !== null);
}

export function cryptoCheckoutMisconfigMessageForAsset(asset: CryptoAsset): string {
  void asset; // kept for API compatibility
  const pref = forcedCryptoProviderOverride();

  if (pref === "paymento" && !isPaymentoConfigured()) {
    return "This asset requires Paymento configuration (PAYMENTO_API_KEY and PAYMENTO_SECRET_KEY).";
  }

  return (
    "This asset requires Paymento (PAYMENTO_API_KEY and PAYMENTO_SECRET_KEY). " +
    "Configure Paymento or use development mode for the built-in simulator."
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
    "Crypto checkout is not available: configure Paymento (PAYMENTO_API_KEY and PAYMENTO_SECRET_KEY), " +
    "or use development mode for the built-in simulator."
  );
}
