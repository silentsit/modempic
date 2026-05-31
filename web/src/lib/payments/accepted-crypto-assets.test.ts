import { describe, expect, it } from "vitest";
import { CryptoAsset } from "@prisma/client";
import {
  ACCEPTED_CHECKOUT_CRYPTO_ASSETS,
  acceptedCheckoutCryptoAssets,
  cryptoAssetCheckoutLabel,
} from "./accepted-crypto-assets";

describe("acceptedCheckoutCryptoAssets", () => {
  it("lists Modempic accepted coins in order", () => {
    expect(acceptedCheckoutCryptoAssets()).toEqual(ACCEPTED_CHECKOUT_CRYPTO_ASSETS);
    expect(ACCEPTED_CHECKOUT_CRYPTO_ASSETS).toEqual([
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
    ]);
  });

  it("labels USDT on TRON distinctly from Tether USDT", () => {
    expect(cryptoAssetCheckoutLabel(CryptoAsset.USDT)).toBe("Tether (USDT)");
    expect(cryptoAssetCheckoutLabel(CryptoAsset.USDT_TRC20)).toBe("USDT (TRON)");
  });
});
