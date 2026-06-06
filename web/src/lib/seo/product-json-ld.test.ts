import { describe, expect, it } from "vitest";
import { buildProductJsonLd, productAggregateRating } from "@/lib/seo/product-json-ld";

describe("productAggregateRating", () => {
  it("returns null when there are no approved reviews", () => {
    expect(productAggregateRating([])).toBe(null);
  });

  it("returns star rating schema with numeric ratingValue and counts", () => {
    const rating = productAggregateRating([
      {
        rating: 5,
        authorName: "Alex",
        title: "Great",
        body: "Solid product.",
        createdAt: new Date("2026-01-15"),
        user: { name: "Alex", image: null },
      },
      {
        rating: 4,
        authorName: null,
        title: null,
        body: "Good value.",
        createdAt: new Date("2026-02-01"),
        user: { name: "Sam", image: null },
      },
    ]);

    expect(rating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.5,
      reviewCount: 2,
      ratingCount: 2,
      bestRating: 5,
      worstRating: 1,
    });
  });
});

describe("buildProductJsonLd", () => {
  const baseProduct = {
    id: "p1",
    slug: "buy-modalert-200-mg",
    name: "Modalert 200 mg",
    shortDesc: "Catalog listing for Modalert 200 mg.",
    priceCents: 4500,
    compareAtCents: null,
    variants: null,
    purity: null,
    testingStatus: null,
    storageNotes: null,
    shippingRestrictions: null,
    specifications: null,
    images: [{ id: "img1", url: "/products/modalert.jpg", alt: "Modalert", sortOrder: 0, productId: "p1" }],
    categories: [{ category: { id: "c1", slug: "modafinil", name: "Modafinil" } }],
    reviews: [] as Array<{
      rating: number;
      authorName: string | null;
      title: string | null;
      body: string;
      createdAt: Date;
      user: { name: string | null; image: string | null };
    }>,
  };

  it("omits aggregateRating when there are no reviews", () => {
    const jsonLd = buildProductJsonLd(baseProduct, "https://modempic.com");
    expect(jsonLd.aggregateRating).toBeUndefined();
    expect(jsonLd.review).toBeUndefined();
  });

  it("includes aggregateRating and review snippets when reviews exist", () => {
    const jsonLd = buildProductJsonLd(
      {
        ...baseProduct,
        reviews: [
          {
            rating: 5,
            authorName: "Alex",
            title: "Reliable",
            body: "Fast shipping.",
            createdAt: new Date("2026-03-01"),
            user: { name: "Alex", image: null },
          },
        ],
      },
      "https://modempic.com",
    );

    expect(jsonLd.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 5,
      reviewCount: 1,
      ratingCount: 1,
      bestRating: 5,
      worstRating: 1,
    });
    expect(jsonLd.review).toHaveLength(1);
    expect(jsonLd.review?.[0].reviewRating.ratingValue).toBe(5);
  });
});
