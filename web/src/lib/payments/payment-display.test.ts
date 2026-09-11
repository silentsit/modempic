import { describe, expect, it } from "vitest";
import { paymentProviderDisplayLabel } from "./payment-display";

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
});
