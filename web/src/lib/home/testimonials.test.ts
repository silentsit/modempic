import { describe, expect, it } from "vitest";
import { selectHomepageTestimonials } from "./testimonials";

const candidate = (
  id: string,
  productSlug: string,
  createdAt: string,
) => ({
  id,
  quote: `Review ${id} with enough detail to qualify for homepage display.`,
  name: `Customer ${id}`,
  rating: 5,
  productName: `Product ${productSlug}`,
  productSlug,
  createdAt: new Date(createdAt),
});

describe("selectHomepageTestimonials", () => {
  it("keeps one review per product", () => {
    const selected = selectHomepageTestimonials([
      candidate("a", "modalert", "2026-08-03"),
      candidate("b", "modalert", "2026-08-02"),
      candidate("c", "waklert", "2026-08-01"),
    ]);

    expect(selected.map((item) => item.id)).toEqual(["a", "c"]);
  });

  it("honors the requested limit", () => {
    const selected = selectHomepageTestimonials(
      [
        candidate("a", "a", "2026-08-03"),
        candidate("b", "b", "2026-08-02"),
        candidate("c", "c", "2026-08-01"),
      ],
      2,
    );

    expect(selected).toHaveLength(2);
  });
});
