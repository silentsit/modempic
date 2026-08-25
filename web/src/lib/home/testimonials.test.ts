import { describe, expect, it } from "vitest";
import { humanizeQuote, selectHomepageTestimonials } from "./testimonials";

const candidate = (id: string, productSlug: string, createdAt: string) => ({
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
      [candidate("a", "a", "2026-08-03"), candidate("b", "b", "2026-08-02"), candidate("c", "c", "2026-08-01")],
      2,
    );

    expect(selected).toHaveLength(2);
  });
});

describe("humanizeQuote", () => {
  it("decodes entities and trims trailing promo filler", () => {
    expect(humanizeQuote("Arrived in 9 days &amp; packaged well. Highly recommend!!!")).toBe(
      'Arrived in 9 days & packaged well.',
    );
  });

  it("cuts long quotes at a sentence when possible", () => {
    const quote = humanizeQuote(
      "Found through reddit. Bought and sent to my mailbox and took only 9 days. Tried it and it's legit the real product. Be warned though, if you track through the website tracking option it will say the package is still overseas.",
      150,
    );
    expect(quote.length).toBeLessThanOrEqual(150);
    expect(quote).toContain("Found through reddit.");
  });
});
