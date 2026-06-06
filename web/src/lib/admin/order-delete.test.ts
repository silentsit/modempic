import { describe, expect, it } from "vitest";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { isOrderDeletable, orderDeleteBlockedReason } from "./order-delete";

describe("orderDeleteBlockedReason", () => {
  it("allows draft orders without payments", () => {
    expect(
      orderDeleteBlockedReason({
        status: OrderStatus.DRAFT,
        completedAt: null,
        payments: [],
      }),
    ).toBeNull();
  });

  it("blocks completed orders", () => {
    expect(
      orderDeleteBlockedReason({
        status: OrderStatus.COMPLETED,
        completedAt: null,
        payments: [],
      }),
    ).toMatch(/Only draft/);
  });

  it("blocks orders with completedAt set", () => {
    expect(
      orderDeleteBlockedReason({
        status: OrderStatus.CANCELLED,
        completedAt: new Date(),
        payments: [],
      }),
    ).toMatch(/completed cannot be deleted/);
  });

  it("blocks orders with succeeded payments", () => {
    expect(
      orderDeleteBlockedReason({
        status: OrderStatus.PENDING_PAYMENT,
        completedAt: null,
        payments: [{ status: PaymentStatus.SUCCEEDED }],
      }),
    ).toMatch(/successful or refunded payments/);
  });

  it("allows cancelled orders with failed payments", () => {
    expect(
      isOrderDeletable({
        status: OrderStatus.CANCELLED,
        completedAt: null,
        payments: [{ status: PaymentStatus.FAILED }, { status: PaymentStatus.EXPIRED }],
      }),
    ).toBe(true);
  });
});
