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

import {
  SOCIAL_PROOF_DISPLAY_COUNT_MAX,
  SOCIAL_PROOF_DISPLAY_COUNT_MIN,
} from "./display-count";
import { generateComboSlides } from "./stream-aggregates";

describe("generateComboSlides", () => {
  it("includes site-wide and product-specific combos", async () => {
    const slides = await generateComboSlides({
      comboNotificationId: "combo-test",
      aggregateHours: 24,
    });
    expect(slides.length).toBeGreaterThanOrEqual(3);
    expect(slides[0]?.productHint).toBeUndefined();
    expect(slides.some((s) => s.productHint === "Artvigil 150mg" || s.productHint === "Modalert 200mg")).toBe(true);
    for (const slide of slides) {
      expect(slide.count).toBeGreaterThanOrEqual(SOCIAL_PROOF_DISPLAY_COUNT_MIN);
      expect(slide.count).toBeLessThanOrEqual(SOCIAL_PROOF_DISPLAY_COUNT_MAX);
      expect(slide.windowLabel.length).toBeGreaterThan(0);
    }
  });
});
