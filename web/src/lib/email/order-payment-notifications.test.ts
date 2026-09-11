import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendOrderPaidEmail: vi.fn(),
  sendAdminNewOrderEmail: vi.fn(),
  onOrderPaymentSucceeded: vi.fn(),
  prisma: {
    user: { findUnique: vi.fn() },
    order: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/email/send", () => ({
  sendOrderPaidEmail: mocks.sendOrderPaidEmail,
  sendAdminNewOrderEmail: mocks.sendAdminNewOrderEmail,
}));
vi.mock("@/lib/email/funnels/order-payment", () => ({
  onOrderPaymentSucceeded: mocks.onOrderPaymentSucceeded,
}));
vi.mock("@/lib/env", () => ({
  env: { ADMIN_ORDER_NOTIFICATION_EMAIL: undefined },
}));

import { sendOrderPaymentSucceededNotifications } from "./order-payment-notifications";

describe("sendOrderPaymentSucceededNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.user.findUnique.mockResolvedValue({ email: "buyer@example.com" });
    mocks.prisma.order.findUnique.mockResolvedValue({
      orderNumber: "MP-1",
      createdAt: new Date("2026-06-01T10:00:00Z"),
      subtotalCents: 1000,
      taxCents: 0,
      shippingCents: 0,
      discountCents: 0,
      totalCents: 1000,
      shippingMethod: "Standard",
      lines: [],
      shippingAddress: null,
      billingAddress: null,
      payments: [{ method: "CARD_ONRAMP" }],
      user: { name: "Buyer" },
    });
    mocks.onOrderPaymentSucceeded.mockResolvedValue(undefined);
  });

  it("emails customer and info@modempic.com when payment succeeds", async () => {
    await sendOrderPaymentSucceededNotifications({
      orderId: "order_1",
      orderNumber: "MP-1",
      userId: "user_1",
    });

    expect(mocks.sendOrderPaidEmail).toHaveBeenCalledWith("buyer@example.com", "MP-1");
    expect(mocks.sendAdminNewOrderEmail).toHaveBeenCalledWith(
      "info@modempic.com",
      expect.objectContaining({ orderNumber: "MP-1" }),
    );
    expect(mocks.onOrderPaymentSucceeded).toHaveBeenCalledWith("order_1");
  });
});
