import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findMany: vi.fn().mockResolvedValue([
        { name: "Sleep Support Caps", slug: "sleep-support", images: [{ url: "https://example.com/img.jpg" }] },
      ]),
    },
  },
}));

import { generateSyntheticActivity } from "./synthetic";

describe("generateSyntheticActivity", () => {
  it("returns items with names and action lines", async () => {
    const items = await generateSyntheticActivity({
      count: 5,
      windowDays: 7,
    });
    expect(items.length).toBeGreaterThanOrEqual(5);
    for (const item of items) {
      expect(item.displayName.length).toBeGreaterThan(0);
      expect(item.actionLine.length).toBeGreaterThan(0);
      expect(item.completedAtIso).toMatch(/^\d{4}-/);
      expect(item.synthetic).toBe(true);
    }
  });

  it("can hide location when showLocation is false", async () => {
    const items = await generateSyntheticActivity({ count: 3, showLocation: false });
    for (const item of items) {
      expect(item.locationLine).toBeNull();
    }
  });
});
