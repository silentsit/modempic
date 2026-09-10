import { createHmac } from "node:crypto";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cardToUsdtCanonicalString } from "./signature";

const mocks = vi.hoisted(() => {
  const tx = {
    payment: { update: vi.fn() },
    order: { updateMany: vi.fn(), update: vi.fn() },
    webhookEvent: { updateMany: vi.fn() },
    coupon: { update: vi.fn() },
  };
  return {
    tx,
    prisma: {
      order: { findUnique: vi.fn() },
      paymentEvent: { findUnique: vi.fn(), create: vi.fn() },
      webhookEvent: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
      payment: { update: vi.fn() },
      user: { findUnique: vi.fn() },
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    },
    sendOrderPaidEmail: vi.fn(),
    onOrderPaymentSucceeded: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/email/send", () => ({ sendOrderPaidEmail: mocks.sendOrderPaidEmail }));
vi.mock("@/lib/email/funnels/order-payment", () => ({
  onOrderPaymentSucceeded: mocks.onOrderPaymentSucceeded,
}));
vi.mock("./config", () => ({
  cardToUsdtFulfillBand: () => 0.95,
  cardToUsdtOurWebhookSecret: (orderId: string) => `secret:${orderId}`,
  cardToUsdtApiBase: () => "https://api.cardtousdt.to",
}));

import { processCardToUsdtWebhook } from "./process-webhook";

const order = {
  id: "order_1",
  orderNumber: "MP-TEST-1",
  userId: "user_1",
  status: OrderStatus.PENDING_PAYMENT,
  completedAt: null,
  couponId: null,
  payments: [
    {
      id: "payment_1",
      status: PaymentStatus.PENDING,
    },
  ],
};

const checkoutEvent = {
  payload: {
    amountUsd: 100,
    amount: 100,
    currency: "USD",
    webhookSecret: null,
    checkoutUrl: "https://checkout.cardtousdt.to/pay.php?id=abc",
    createdAt: "2026-09-10T08:00:00Z",
  },
};

function webhookUrl(extra = "") {
  return (
    "https://modempic.com/api/webhooks/cardtousdt" +
    "?order_id=MP-TEST-1&secret=secret%3AMP-TEST-1" +
    "&txid_out=0xtx1&value_coin=95&coin=polygon_usdc" +
    extra
  );
}

describe("processCardToUsdtWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.order.findUnique.mockResolvedValue(order);
    mocks.prisma.paymentEvent.findUnique.mockResolvedValue(checkoutEvent);
    mocks.prisma.webhookEvent.findFirst.mockResolvedValue(null);
    mocks.prisma.webhookEvent.create.mockResolvedValue({ id: "webhook_1" });
    mocks.prisma.paymentEvent.create.mockResolvedValue({ id: "settlement_1" });
    mocks.tx.order.updateMany.mockResolvedValue({ count: 1 });
    mocks.prisma.user.findUnique.mockResolvedValue({ email: null });
    mocks.onOrderPaymentSucceeded.mockResolvedValue(undefined);
  });

  it("rejects a notice without settlement fields before database work", async () => {
    const result = await processCardToUsdtWebhook(
      new Request("https://modempic.com/api/webhooks/cardtousdt?order_id=MP-TEST-1"),
    );
    expect(result).toEqual({ status: 400, message: "missing settlement fields" });
    expect(mocks.prisma.order.findUnique).not.toHaveBeenCalled();
  });

  it("fulfils a signed-by-URL-secret stablecoin settlement at the band", async () => {
    const result = await processCardToUsdtWebhook(new Request(webhookUrl()));
    expect(result).toEqual({ status: 200 });
    expect(mocks.tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "payment_1" },
        data: expect.objectContaining({ status: PaymentStatus.SUCCEEDED, externalId: "0xtx1" }),
      }),
    );
    expect(mocks.tx.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order_1", completedAt: null },
        data: expect.objectContaining({ status: OrderStatus.COMPLETED }),
      }),
    );
  });

  it("rejects a bad URL secret without recording a webhook", async () => {
    const result = await processCardToUsdtWebhook(
      new Request(webhookUrl().replace("secret%3AMP-TEST-1", "wrong")),
    );
    expect(result).toEqual({ status: 403, message: "invalid webhook secret" });
    expect(mocks.prisma.webhookEvent.create).not.toHaveBeenCalled();
  });

  it("propagates non-duplicate settlement-event database errors for a provider retry", async () => {
    mocks.prisma.paymentEvent.create.mockRejectedValue(new Error("database unavailable"));
    await expect(processCardToUsdtWebhook(new Request(webhookUrl()))).rejects.toThrow(
      "database unavailable",
    );
    expect(mocks.tx.payment.update).not.toHaveBeenCalled();
  });

  it("continues fulfilment after a duplicate settlement event", async () => {
    mocks.prisma.paymentEvent.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "6.6.0",
      }),
    );
    await expect(processCardToUsdtWebhook(new Request(webhookUrl()))).resolves.toEqual({
      status: 200,
    });
    expect(mocks.tx.payment.update).toHaveBeenCalled();
  });

  it("verifies provider HMAC when checkout creation returned a webhook secret", async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const webhookSecret = "whsec_test";
    const canonical = cardToUsdtCanonicalString({
      timestamp,
      txidOut: "0xtx1",
      valueCoin: "95",
      coin: "polygon_usdc",
    });
    const signature = `v1=${createHmac("sha256", webhookSecret).update(canonical).digest("hex")}`;
    mocks.prisma.paymentEvent.findUnique.mockResolvedValue({
      ...checkoutEvent,
      payload: { ...checkoutEvent.payload, webhookSecret },
    });

    const result = await processCardToUsdtWebhook(
      new Request(`${webhookUrl()}&c2t_ts=${timestamp}&c2t_sig=${signature}`),
    );
    expect(result).toEqual({ status: 200 });
    expect(mocks.tx.payment.update).toHaveBeenCalled();
  });
});
