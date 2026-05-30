import { describe, expect, it } from "vitest";
import { buildSocialProofSlides } from "./slides";

describe("buildSocialProofSlides", () => {
  it("prepends combo and appends informational and review slides", () => {
    const slides = buildSocialProofSlides({
      items: [
        {
          message: "Alex purchased X",
          completedAtIso: "2026-05-01T12:00:00.000Z",
          displayName: "Alex",
          actionLine: "Purchased X.",
        },
      ],
      combo: { count: 12, hours: 24 },
      counter: { count: 127, message: "visitors are online" },
      informational: [{ id: "info-1", title: "Free shipping", body: "Over $50", icon: "truck" }],
      reviews: [
        {
          review: {
            id: "r1",
            authorName: "Sam",
            rating: 5,
            excerpt: "Love it",
            createdAtIso: "2026-05-01T12:00:00.000Z",
          },
        },
      ],
    });
    expect(slides).toHaveLength(5);
    expect(slides[0]?.kind).toBe("counter");
    expect(slides[1]?.kind).toBe("combo");
    expect(slides[2]?.kind).toBe("activity");
    expect(slides.some((s) => s.kind === "review")).toBe(true);
    expect(slides.some((s) => s.kind === "informational")).toBe(true);
  });

  it("omits combo when count is zero", () => {
    const slides = buildSocialProofSlides({
      items: [
        {
          message: "test",
          completedAtIso: "2026-05-01T12:00:00.000Z",
          displayName: "Sam",
          actionLine: "just completed an order",
        },
      ],
      combo: { count: 0, hours: 24 },
    });
    expect(slides).toHaveLength(1);
    expect(slides[0]?.kind).toBe("activity");
  });
});
