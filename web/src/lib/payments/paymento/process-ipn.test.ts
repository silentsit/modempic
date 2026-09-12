import { OrderStatus, PaymentStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
      payment: { findFirst: vi.fn(), update: vi.fn() },
      paymentEvent: { create: vi.fn() },
      webhookEvent: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    },
    paymentoVerifyToken: vi.fn(),
    sendOrderPaymentSucceededNotifications: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({ prisma: mocks.prisma }));
vi.mock("./client", () => ({ paymentoVerifyToken: mocks.paymentoVerifyToken }));
vi.mock("@/lib/email/order-payment-notifications", () => ({
  sendOrderPaymentSucceededNotifications: mocks.sendOrderPaymentSucceededNotifications,
}));

import { processPaymentoIpn } from "./process-ipn";

const order = {
  id: "order_1",
  orderNumber: "MP-1",
  userId: "user_1",
  status: OrderStatus.PENDING_PAYMENT,
  completedAt: null,
  couponId: null,
  payments: [{ id: "payment_1", provider: "paymento" }],
};

const paidPayload = {
  Token: "tok_1",
  PaymentId: 20016,
  OrderId: "MP-1",
  OrderStatus: 7,
};

function confirmedVerify(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    fullyConfirmed: true,
    waitingForConfirmation: false,
    invalidToken: false,
    orderId: "MP-1",
    orderStatus: 7,
    raw: {},
    ...overrides,
  };
}

describe("processPaymentoIpn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.webhookEvent.findFirst.mockResolvedValue(null);
    mocks.prisma.webhookEvent.create.mockResolvedValue({ id: "wh_1" });
    mocks.prisma.order.findUnique.mockResolvedValue(order);
    mocks.prisma.paymentEvent.create.mockResolvedValue({});
    mocks.tx.order.updateMany.mockResolvedValue({ count: 1 });
    mocks.sendOrderPaymentSucceededNotifications.mockResolvedValue(undefined);
    mocks.paymentoVerifyToken.mockResolvedValue(confirmedVerify());
  });

  it("does not email or fulfill while the transaction is still confirming", async () => {
    const result = await processPaymentoIpn(
      JSON.stringify({ ...paidPayload, OrderStatus: 3 }),
      { ...paidPayload, OrderStatus: 3 },
    );

    expect(result).toEqual({ status: 200 });
    expect(mocks.paymentoVerifyToken).not.toHaveBeenCalled();
    expect(mocks.sendOrderPaymentSucceededNotifications).not.toHaveBeenCalled();
    expect(mocks.tx.payment.update).not.toHaveBeenCalled();
  });

  it("fulfills and emails after Paid verify even when success is false", async () => {
    mocks.paymentoVerifyToken.mockResolvedValue(confirmedVerify({ ok: true, orderStatus: 7 }));

    const result = await processPaymentoIpn(JSON.stringify(paidPayload), paidPayload);

    expect(result).toEqual({ status: 200 });
    expect(mocks.tx.payment.update).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: { status: PaymentStatus.SUCCEEDED, externalId: "tok_1" },
    });
    expect(mocks.sendOrderPaymentSucceededNotifications).toHaveBeenCalledWith({
      orderId: "order_1",
      orderNumber: "MP-1",
      userId: "user_1",
    });
  });

  it("also fulfills on Approve after the store verify", async () => {
    const payload = { ...paidPayload, OrderStatus: 8 };
    mocks.paymentoVerifyToken.mockResolvedValue(confirmedVerify({ orderStatus: 8 }));

    const result = await processPaymentoIpn(JSON.stringify(payload), payload);

    expect(result).toEqual({ status: 200 });
    expect(mocks.sendOrderPaymentSucceededNotifications).toHaveBeenCalled();
  });

  it("does not fail the payment when verify still reports WaitingToConfirm", async () => {
    mocks.paymentoVerifyToken.mockResolvedValue({
      ok: false,
      fullyConfirmed: false,
      waitingForConfirmation: true,
      invalidToken: false,
      orderStatus: 3,
      raw: {},
    });

    const result = await processPaymentoIpn(JSON.stringify(paidPayload), paidPayload);

    expect(result).toEqual({ status: 200 });
    expect(mocks.prisma.payment.update).not.toHaveBeenCalled();
    expect(mocks.sendOrderPaymentSucceededNotifications).not.toHaveBeenCalled();
  });

  it("asks Paymento to retry when verify is inconclusive", async () => {
    mocks.paymentoVerifyToken.mockResolvedValue({
      ok: false,
      fullyConfirmed: false,
      waitingForConfirmation: false,
      invalidToken: false,
      raw: {},
    });

    const result = await processPaymentoIpn(JSON.stringify(paidPayload), paidPayload);

    expect(result).toEqual({
      status: 400,
      message: "Paymento verify did not confirm a completed transaction",
    });
    expect(mocks.sendOrderPaymentSucceededNotifications).not.toHaveBeenCalled();
  });
});
