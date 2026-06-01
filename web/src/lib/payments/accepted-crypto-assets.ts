import { CryptoAsset } from "@prisma/client";

/** Storefront checkout — order and labels match Modempic accepted payment coins. */
export const ACCEPTED_CHECKOUT_CRYPTO_ASSETS: CryptoAsset[] = [
  CryptoAsset.BTC,
  CryptoAsset.USDT,
  CryptoAsset.USDT_TRC20,
  CryptoAsset.USDC,
  CryptoAsset.BNB,
  CryptoAsset.TRX,
  CryptoAsset.SOL,
  CryptoAsset.ETH,
  CryptoAsset.LTC,
  CryptoAsset.PAXG,
];

const CHECKOUT_LABELS: Partial<Record<CryptoAsset, string>> = {
  [CryptoAsset.BTC]: "Bitcoin (BTC)",
  [CryptoAsset.USDT]: "USDT (ERC-20)",
  [CryptoAsset.USDT_TRC20]: "USDT (TRX)",
  [CryptoAsset.USDC]: "USD Coin (USDC)",
  [CryptoAsset.BNB]: "BNB",
  [CryptoAsset.TRX]: "TRON (TRX)",
  [CryptoAsset.SOL]: "Solana (SOL)",
  [CryptoAsset.ETH]: "Ethereum (ETH)",
  [CryptoAsset.LTC]: "Litecoin (LTC)",
  [CryptoAsset.PAXG]: "PAX Gold (PAXG)",
};

export function acceptedCheckoutCryptoAssets(): CryptoAsset[] {
  return ACCEPTED_CHECKOUT_CRYPTO_ASSETS;
}

export function cryptoAssetCheckoutLabel(asset: CryptoAsset): string {
  return CHECKOUT_LABELS[asset] ?? asset;
}
