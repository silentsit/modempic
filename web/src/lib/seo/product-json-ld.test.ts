import { describe, expect, it } from "vitest";
import {
  buildProductJsonLd,
  productAggregateRating,
  productJsonLdDescription,
  productJsonLdSize,
} from "@/lib/seo/product-json-ld";

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
    manufacturer: null,
    activeIngredient: null,
    strengthMg: null,
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

  it("includes merchant listing fields Google flags as missing", () => {
    const jsonLd = buildProductJsonLd(
      {
        ...baseProduct,
        variants: [
          { label: "30 tablets", priceCents: 4500 },
          { label: "60 tablets", priceCents: 8000 },
        ],
      },
      "https://modempic.com",
    );

    expect(jsonLd.description).toBe("Catalog listing for Modalert 200 mg.");
    expect(jsonLd.size).toBe("30 tablets / 60 tablets");
    expect(jsonLd.offers.shippingDetails["@type"]).toBe("OfferShippingDetails");
    expect(jsonLd.offers.shippingDetails.shippingRate.value).toBe("0.00");
    expect(jsonLd.offers.hasMerchantReturnPolicy["@type"]).toBe("MerchantReturnPolicy");
    expect(jsonLd.offers.hasMerchantReturnPolicy.merchantReturnDays).toBe(14);
    expect(jsonLd.offers.itemCondition).toBe("https://schema.org/NewCondition");
    expect(jsonLd.offers.seller).toEqual({
      "@type": "Organization",
      name: "Modempic",
      url: "https://modempic.com",
    });
    expect(jsonLd.category).toBe("Modafinil");
    expect(jsonLd.brand).toEqual({ "@type": "Brand", name: "Modalert" });
    expect(jsonLd.offers.shippingDetails.deliveryTime.transitTime.maxValue).toBe(7);
  });

  it("uses the label manufacturer when present", () => {
    const jsonLd = buildProductJsonLd(
      {
        ...baseProduct,
        manufacturer: "Sun Pharmaceutical Industries Ltd",
      },
      "https://modempic.com",
    );
    expect(jsonLd.manufacturer).toEqual({
      "@type": "Organization",
      name: "Sun Pharmaceutical Industries Ltd",
    });
  });
});

describe("productJsonLdDescription", () => {
  it("falls back when short description is empty", () => {
    expect(
      productJsonLdDescription({
        name: "Modalert 200 mg",
        shortDesc: "",
        seoDesc: null,
        longDesc: "",
      }),
    ).toMatch(/Shop Modalert 200 mg/);
  });
});

describe("productJsonLdSize", () => {
  it("uses pack labels when variants exist", () => {
    expect(productJsonLdSize({ name: "Modalert 200 mg", variants: [{ label: "30 tablets", priceCents: 4500 }] })).toBe(
      "30 tablets",
    );
  });

  it("uses strength from the product name when there is no pack size", () => {
    expect(productJsonLdSize({ name: "Modalert 200 mg", variants: null })).toBe("200 mg");
  });
});
