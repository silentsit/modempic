import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    PAYMENTO_API_KEY: "test-key",
    PAYMENTO_API_BASE: "https://api.paymento.io",
    PAYMENTO_GATEWAY_BASE: undefined,
    PAYMENTO_SPEED: "0",
  },
}));

import { getPaymentoSpeedFromEnv, paymentoCreatePaymentRequest, paymentoVerifyToken } from "./client";

describe("getPaymentoSpeedFromEnv", () => {
  it("always waits for blockchain confirmations", () => {
    expect(getPaymentoSpeedFromEnv()).toBe(1);
  });
});

describe("paymentoCreatePaymentRequest", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, body: "token-1" }),
      }),
    );
  });

  it("sends RiskSpeed so Paymento waits for confirmations", async () => {
    await paymentoCreatePaymentRequest({
      fiatAmount: "29.99",
      fiatCurrency: "USD",
      orderId: "MP-1",
      returnUrl: "https://modempic.com/checkout/payment?order=MP-1",
      speed: 1,
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.paymento.io/v1/payment/request",
      expect.objectContaining({
        body: expect.stringContaining('"RiskSpeed":1'),
      }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://api.paymento.io/v1/payment/request",
      expect.objectContaining({
        body: expect.stringContaining('"Speed":1'),
      }),
    );
  });
});

describe("paymentoVerifyToken", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("confirms a Paid order even when success is false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          message: "",
          body: { orderId: "MP-1", orderStatus: "7" },
        }),
      }),
    );

    const result = await paymentoVerifyToken("tok");
    expect(result.ok).toBe(true);
    expect(result.fullyConfirmed).toBe(true);
    expect(result.orderId).toBe("MP-1");
  });

  it("does not confirm WaitingToConfirm", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          body: { orderId: "MP-1", orderStatus: "WaitingToConfirm" },
        }),
      }),
    );

    const result = await paymentoVerifyToken("tok");
    expect(result.ok).toBe(false);
    expect(result.fullyConfirmed).toBe(false);
    expect(result.waitingForConfirmation).toBe(true);
  });
});
