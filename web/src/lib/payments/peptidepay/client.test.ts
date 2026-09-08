import { afterEach, describe, expect, it, vi } from "vitest";

const mockEnv = vi.hoisted(() => ({
  PEPTIDEPAY_API_KEY: "test-key",
  PEPTIDEPAY_API_BASE: "https://pay.example.test",
}));

vi.mock("@/lib/env", () => ({ env: mockEnv }));

import { peptidePayCreateCheckoutSession } from "./client";

const input = {
  amountCents: 12_000,
  currency: "USD",
  email: "buyer@example.com",
  successUrl: "https://modempic.com/order/example/confirmation",
  cancelUrl: "https://modempic.com/order/example/confirmation",
  webhookUrl: "https://modempic.com/api/webhooks/peptidepay",
  orderId: "MP-TEST",
  idempotencyKey: "order-id",
};

describe("peptidePayCreateCheckoutSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns a controlled error when the provider request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    await expect(peptidePayCreateCheckoutSession(input)).resolves.toEqual({
      success: false,
      error: "PeptidePay is temporarily unavailable",
    });
  });

  it("returns the provider status when an error response is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })),
    );

    await expect(peptidePayCreateCheckoutSession(input)).resolves.toEqual({
      success: false,
      error: "PeptidePay returned HTTP 502",
    });
  });

  it("returns a valid hosted checkout session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          { id: "session-1", url: "https://pay.example.test/session-1" },
          { status: 200 },
        ),
      ),
    );

    await expect(peptidePayCreateCheckoutSession(input)).resolves.toEqual({
      success: true,
      id: "session-1",
      url: "https://pay.example.test/session-1",
    });
  });
});
