import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findMany: vi.fn().mockResolvedValue([
        { name: "Sleep Support Caps", slug: "sleep-support", images: [{ url: "https://example.com/img.jpg" }] },
        { name: "Energy Boost", slug: "energy-boost", images: [] },
      ]),
    },
  },
}));

import { generateSyntheticActivity } from "./synthetic";

describe("generateSyntheticActivity", () => {
  it("returns items with last-initial names and action lines", async () => {
    const items = await generateSyntheticActivity({
      count: 20,
      windowDays: 7,
    });
    expect(items.length).toBeGreaterThanOrEqual(8);
    for (const item of items) {
      expect(item.displayName.length).toBeGreaterThan(0);
      expect(item.actionLine.length).toBeGreaterThan(0);
      expect(item.completedAtIso).toMatch(/^\d{4}-/);
      expect(item.timeLabel).toBeTruthy();
      expect(item.synthetic).toBe(true);
      expect(item.actionLine).not.toContain("viewed the shop");
    }
  });

  it("weights toward product purchases", async () => {
    const items = await generateSyntheticActivity({ count: 40, windowDays: 7 });
    const withProduct = items.filter((i) => i.productHint).length;
    expect(withProduct).toBeGreaterThan(items.length * 0.5);
  });

  it("can hide location when showLocation is false", async () => {
    const items = await generateSyntheticActivity({ count: 3, showLocation: false });
    for (const item of items) {
      expect(item.locationLine).toBeNull();
    }
  });
});
