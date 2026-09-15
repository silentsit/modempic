import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findMany: vi.fn().mockResolvedValue([
        { name: "Artvigil 150mg", slug: "artvigil-150mg", images: [] },
        { name: "Modalert 200mg", slug: "modalert-200mg", images: [] },
        { name: "Sleep Support Caps", slug: "sleep-support", images: [] },
      ]),
    },
  },
}));

import { generateComboSlides, generateStreamAggregates } from "./stream-aggregates";

describe("generateComboSlides", () => {
  it("does not emit hashed purchase counts", async () => {
    const slides = await generateComboSlides({
      comboNotificationId: "combo-test",
      aggregateHours: 24,
    });
    expect(slides).toEqual([]);
  });
});

describe("generateStreamAggregates", () => {
  it("does not emit hashed purchase aggregates", async () => {
    await expect(generateStreamAggregates({ streamNotificationId: "stream-test" })).resolves.toEqual([]);
  });
});
