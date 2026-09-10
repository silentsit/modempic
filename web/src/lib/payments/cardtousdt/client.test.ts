import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./config", () => ({
  cardToUsdtApiBase: () => "https://api.cardtousdt.to",
  isSafeCardToUsdtCheckoutUrl: (value: string) => value.startsWith("https://"),
}));

import { cardToUsdtCreateCheckout } from "./client";

const input = {
  payoutAddress: "0x1234567890abcdef1234567890abcdef12345678",
  amount: 19.99,
  currency: "USD" as const,
  buyerEmail: "buyer@example.com",
  orderId: "MP-TEST-1",
  webhookUrl: "https://modempic.com/api/webhooks/cardtousdt?order_id=MP-TEST-1&secret=x",
};

function success(overrides: Record<string, unknown> = {}) {
  return {
    checkout_url: "https://checkout.cardtousdt.to/pay.php?id=abc",
    deposit_address: "0xbc38a1b2c3d4e5f678901234567890abcdef1234",
    amount: 19.99,
    currency: "USD",
    amount_usd: 19.99,
    order_id: "MP-TEST-1",
    webhook_secret: "whsec_test",
    created_at: "2026-09-10T08:00:00Z",
    ...overrides,
  };
}

function mockJsonResponse(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", "X-Request-Id": "req_1" },
      }),
    ),
  );
}

describe("cardToUsdtCreateCheckout", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("accepts a matching checkout response", async () => {
    mockJsonResponse(success());
    const result = await cardToUsdtCreateCheckout(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.checkoutUrl).toContain("checkout.cardtousdt.to");
    expect(result.requestId).toBe("req_1");
  });

  it.each([
    ["order id", { order_id: "MP-OTHER" }],
    ["charge amount", { amount: 9.99 }],
    ["USD amount", { amount_usd: 9.99 }],
    ["currency", { currency: "EUR" }],
    ["checkout URL", { checkout_url: "javascript:alert(1)" }],
  ])("rejects a response with a mismatched %s", async (_label, overrides) => {
    mockJsonResponse(success(overrides));
    const result = await cardToUsdtCreateCheckout(input);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("ambiguous_response");
  });

  it("never marks an ambiguous network error retryable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("connection reset"))));
    const result = await cardToUsdtCreateCheckout(input);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("network_error");
    expect(result.retryable).toBe(false);
  });

  it("marks only conversion_failed as automatically retryable", async () => {
    mockJsonResponse(
      { error: { code: "conversion_failed", message: "Could not price", request_id: "req_1" } },
      502,
    );
    const result = await cardToUsdtCreateCheckout(input);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.retryable).toBe(true);
  });
});
