import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    order: { findUnique: vi.fn() },
    payment: { findMany: vi.fn() },
    emailLog: { findMany: vi.fn() },
    adminAuditLog: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { loadOrderTimeline } from "./order-timeline";

const mocked = vi.mocked(prisma);

describe("loadOrderTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges order, payment, email, and admin entries chronologically", async () => {
    const createdAt = new Date("2026-06-01T10:00:00Z");
    const paidAt = new Date("2026-06-01T10:05:00Z");
    const emailAt = new Date("2026-06-01T10:06:00Z");

    mocked.order.findUnique.mockResolvedValue({
      createdAt,
      updatedAt: paidAt,
      completedAt: paidAt,
      status: "COMPLETED",
    } as never);

    mocked.payment.findMany.mockResolvedValue([
      {
        id: "pay1",
        provider: "crypto_sim",
        method: "CRYPTO",
        status: "SUCCEEDED",
        createdAt,
        updatedAt: paidAt,
        events: [{ id: "evt1", type: "SUCCEEDED", createdAt: paidAt, idempotencyKey: "sim_conf_pay1", payload: {} }],
      },
    ] as never);

    mocked.emailLog.findMany.mockResolvedValue([
      {
        id: "em1",
        to: "customer@example.com",
        subject: "Payment received for MP-TEST",
        template: "order-paid",
        status: "sent",
        error: null,
        createdAt: emailAt,
      },
    ] as never);

    mocked.adminAuditLog.findMany.mockResolvedValue([] as never);

    const timeline = await loadOrderTimeline("ord1", "MP-TEST");

    expect(timeline[0]?.title).toBe("Order created");
    expect(timeline.some((e) => e.category === "payment" && e.title === "Succeeded")).toBe(true);
    expect(timeline.some((e) => e.category === "email")).toBe(true);
    expect(timeline.at(-1)?.category).toBe("email");
  });
});
