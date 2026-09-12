import { describe, expect, it } from "vitest";
import { CryptoAsset } from "@prisma/client";
import {
  ACCEPTED_CHECKOUT_CRYPTO_ASSETS,
  acceptedCheckoutCryptoAssets,
  acceptedCheckoutCryptoSummary,
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
      CryptoAsset.PAXG,
    ]);
  });

  it("labels USDT on TRON distinctly from Tether USDT", () => {
    expect(cryptoAssetCheckoutLabel(CryptoAsset.USDT)).toBe("USDT (ERC-20)");
    expect(cryptoAssetCheckoutLabel(CryptoAsset.USDT_TRC20)).toBe("USDT (TRX)");
  });

  it("summarizes every accepted checkout coin", () => {
    expect(acceptedCheckoutCryptoSummary()).toBe(
      "Bitcoin (BTC), USDT (ERC-20), USDT (TRX), USD Coin (USDC), BNB, TRON (TRX), Solana (SOL), Ethereum (ETH), PAX Gold (PAXG)",
    );
  });
});
