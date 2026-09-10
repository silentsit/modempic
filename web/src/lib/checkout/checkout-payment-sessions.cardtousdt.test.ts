import { PaymentStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const payment = {
    id: "payment_1",
    orderId: "order_1",
    method: "CARD_ONRAMP",
    status: "PENDING" as string,
    idempotencyKey: "cardtousdt_init_MP-TEST-1",
    amountCents: 10_000,
    currency: "USD",
    provider: "cardtousdt",
    externalId: null as string | null,
    asset: null,
    payAddress: null as string | null,
    payAmountCrypto: null,
    expiresAt: null,
    failureReason: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const updateMany = vi.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
    if (where.id !== payment.id) return { count: 0 };
    if ("externalId" in where && where.externalId !== payment.externalId) return { count: 0 };
    if ("payAddress" in where && where.payAddress !== payment.payAddress) return { count: 0 };
    if ("status" in where && where.status !== payment.status) return { count: 0 };
    Object.assign(payment, data, { updatedAt: new Date() });
    return { count: 1 };
  });

  const tx = {
    payment: { updateMany },
    paymentEvent: { create: vi.fn() },
  };

  return {
    payment,
    updateMany,
    tx,
    prisma: {
      payment: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        updateMany,
      },
      paymentEvent: { upsert: vi.fn() },
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    },
    createCheckout: vi.fn(),
    clearMatching: vi.fn(),
    restore: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/payments/paymento", () => ({
  paymentoCreatePaymentRequest: vi.fn(),
  paymentoGatewayUrl: vi.fn(),
  getPaymentoSpeedFromEnv: vi.fn(),
}));
vi.mock("@/lib/payments/cardtousdt", () => ({
  buildCardToUsdtWebhookUrl: () =>
    "https://modempic.com/api/webhooks/cardtousdt?order_id=MP-TEST-1&secret=x",
  cardToUsdtCreateCheckout: mocks.createCheckout,
  cardToUsdtPayoutAddress: () => "0x1234567890abcdef1234567890abcdef12345678",
  cardToUsdtChargeAmount: (cents: number) => cents / 100,
  CARDTOUSDT_PROVIDER: "cardtousdt",
}));
vi.mock("@/lib/checkout/checkout-cart", () => ({
  clearMatchingCheckoutCartLines: mocks.clearMatching,
  restoreCartIfEmpty: mocks.restore,
}));

import { createCardToUsdtCheckoutSession } from "./checkout-payment-sessions";

const params = {
  orderId: "order_1",
  orderNumber: "MP-TEST-1",
  totalCents: 10_000,
  buyerEmail: "buyer@example.com",
  cartId: "cart_1",
  cartRestoreLines: [
    {
      productId: "product_1",
      quantity: 1,
      unitPriceCents: 10_000,
      variantKey: "",
      variantId: null,
    },
  ],
};

const created = {
  ok: true as const,
  checkoutUrl: "https://checkout.cardtousdt.to/pay.php?id=abc",
  depositAddress: "0xbc38a1b2c3d4e5f678901234567890abcdef1234",
  amount: 100,
  currency: "USD",
  amountUsd: 100,
  orderId: "MP-TEST-1",
  webhookSecret: "whsec_test",
  createdAt: "2026-09-10T08:00:00Z",
  requestId: "req_1",
};

describe("createCardToUsdtCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mocks.payment, {
      status: PaymentStatus.PENDING,
      externalId: null,
      payAddress: null,
      failureReason: null,
    });
    mocks.prisma.payment.findFirst.mockImplementation(async () => ({ ...mocks.payment }));
    mocks.prisma.payment.findUnique.mockImplementation(async () => ({ ...mocks.payment }));
  });

  it("allows only one provider POST when two handoffs race", async () => {
    let finishCreate!: (value: typeof created) => void;
    mocks.createCheckout.mockImplementationOnce(
      () => new Promise<typeof created>((resolve) => {
        finishCreate = resolve;
      }),
    );

    const first = createCardToUsdtCheckoutSession(params);
    await vi.waitFor(() => expect(mocks.createCheckout).toHaveBeenCalledTimes(1));

    const second = await createCardToUsdtCheckoutSession(params);
    expect(second.ok).toBe(false);
    expect(mocks.createCheckout).toHaveBeenCalledTimes(1);

    finishCreate(created);
    await expect(first).resolves.toEqual({ ok: true, gatewayUrl: created.checkoutUrl });
    expect(mocks.clearMatching).toHaveBeenCalledWith(params.cartId, params.cartRestoreLines);
  });

  it("holds an ambiguous network failure instead of allowing another checkout", async () => {
    mocks.createCheckout.mockResolvedValue({
      ok: false,
      error: "connection reset",
      code: "network_error",
      retryable: false,
      requestId: null,
    });

    const result = await createCardToUsdtCheckoutSession(params);
    expect(result.ok).toBe(false);
    expect(mocks.payment.status).toBe(PaymentStatus.REQUIRES_ACTION);
    expect(mocks.payment.failureReason).toMatch(/create result was ambiguous/i);
    expect(mocks.createCheckout).toHaveBeenCalledTimes(1);
  });
});
