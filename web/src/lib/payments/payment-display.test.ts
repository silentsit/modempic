import { describe, expect, it } from "vitest";
import { paymentProviderDisplayLabel, paymentProviderName } from "./payment-display";

describe("paymentProviderDisplayLabel", () => {
  it("labels manual invoice card checkout", () => {
    expect(
      paymentProviderDisplayLabel({ provider: "manual_invoice", method: "CARD_ONRAMP" }),
    ).toBe("Credit/Debit Cards (Visa/MasterCard)");
  });

  it("keeps CardToUSDT distinct from manual invoice", () => {
    expect(paymentProviderDisplayLabel({ provider: "cardtousdt", method: "CARD_ONRAMP" })).toBe(
      "Card (CardToUSDT)",
    );
  });

  it("labels crypto by asset", () => {
    expect(paymentProviderDisplayLabel({ provider: "paymento", method: "CRYPTO", asset: "USDT" })).toBe(
      "Pay in USDT",
    );
  });

  it("never surfaces retired BTCPay", () => {
    expect(paymentProviderDisplayLabel({ provider: "btcpay", method: "CRYPTO", asset: "BTC" })).toBe(
      "Pay in BTC",
    );
    expect(paymentProviderDisplayLabel({ provider: "BTCPay", method: "CRYPTO" })).toBe("Cryptocurrency");
    expect(paymentProviderName("btcpay")).toBe("Cryptocurrency");
    expect(paymentProviderName("BTCPay")).toBe("Cryptocurrency");
  });

  it("falls back to method when provider is missing", () => {
    expect(paymentProviderDisplayLabel({ provider: null, method: "WIRE" })).toBe("WIRE");
    expect(paymentProviderDisplayLabel({ provider: "   ", method: "WIRE" })).toBe("WIRE");
  });
});
