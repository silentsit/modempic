import { describe, expect, it } from "vitest";
import { OrderStatus } from "@prisma/client";
import { orderStatusWriteData, shouldIncrementCouponRedemption } from "./order-completion";

describe("order completion helpers", () => {
  it("sets completedAt only when an order first becomes completed", () => {
    const data = orderStatusWriteData(OrderStatus.COMPLETED, null);

    expect(data.status).toBe(OrderStatus.COMPLETED);
    expect(data.completedAt).toBeInstanceOf(Date);
  });

  it("does not overwrite an existing completedAt timestamp", () => {
    const completedAt = new Date("2026-01-01T00:00:00.000Z");
    const data = orderStatusWriteData(OrderStatus.COMPLETED, completedAt);

    expect(data).toEqual({ status: OrderStatus.COMPLETED });
  });

  it("counts coupon redemption only on first completion with a coupon", () => {
    expect(shouldIncrementCouponRedemption(OrderStatus.COMPLETED, null, "coupon_1")).toBe(true);
    expect(shouldIncrementCouponRedemption(OrderStatus.COMPLETED, new Date(), "coupon_1")).toBe(false);
    expect(shouldIncrementCouponRedemption(OrderStatus.PROCESSING, null, "coupon_1")).toBe(false);
    expect(shouldIncrementCouponRedemption(OrderStatus.COMPLETED, null, null)).toBe(false);
  });
});
