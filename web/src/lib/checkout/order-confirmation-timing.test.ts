import { describe, expect, it } from "vitest";
import { defersOrderConfirmationUntilPayment } from "./order-confirmation-timing";

describe("defersOrderConfirmationUntilPayment", () => {
  it("defers CardToUSDT card checkout", () => {
    expect(
      defersOrderConfirmationUntilPayment({ paymentMethod: "CARD_ONRAMP", cryptoProvider: null }),
    ).toBe(true);
  });

  it("defers Paymento crypto checkout", () => {
    expect(
      defersOrderConfirmationUntilPayment({ paymentMethod: "CRYPTO", cryptoProvider: "paymento" }),
    ).toBe(true);
  });

  it("sends manual invoice confirmation at checkout", () => {
    expect(
      defersOrderConfirmationUntilPayment({ paymentMethod: "MANUAL_INVOICE", cryptoProvider: null }),
    ).toBe(false);
  });
});
