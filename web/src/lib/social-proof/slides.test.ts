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
      combos: [{ count: 12, hours: 24, windowLabel: "24 hours" }],
      comboNotificationId: "combo-1",
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

  it("omits combo when combos array is empty", () => {
    const slides = buildSocialProofSlides({
      items: [
        {
          message: "test",
          completedAtIso: "2026-05-01T12:00:00.000Z",
          displayName: "Sam",
          actionLine: "just completed an order",
        },
      ],
      combos: [],
      comboNotificationId: "combo-1",
    });
    expect(slides).toHaveLength(1);
    expect(slides[0]?.kind).toBe("activity");
  });

  it("prepends multiple combo slides including product variants", () => {
    const slides = buildSocialProofSlides({
      items: [
        {
          message: "test",
          completedAtIso: "2026-05-01T12:00:00.000Z",
          displayName: "Sam",
          actionLine: "just purchased",
          productHint: "Example",
        },
      ],
      combos: [
        { count: 247, hours: 24, windowLabel: "24 hours" },
        {
          count: 870,
          hours: 168,
          windowLabel: "7 days",
          productHint: "Artvigil 150mg",
          productSlug: "artvigil-150mg",
        },
      ],
      comboNotificationId: "combo-1",
    });
    expect(slides.filter((s) => s.kind === "combo")).toHaveLength(2);
    const productCombo = slides.find(
      (s) => s.kind === "combo" && s.productHint === "Artvigil 150mg",
    );
    expect(productCombo).toBeDefined();
  });
});
