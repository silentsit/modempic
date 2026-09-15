import { describe, expect, it } from "vitest";
import { ratingBreakdownFromCounts } from "./reviews";
import {
  buildReviewsHubJsonLd,
  clampReviewsHubPage,
  isReviewsHubIndexable,
  parseReviewsHubQuery,
  reviewsHubAverage,
  reviewsHubHref,
  reviewsHubSkip,
  REVIEWS_HUB_PATH,
  roundReviewsHubRating,
  storefrontReviewDisplayName,
} from "./reviews-hub";

describe("reviews hub query params", () => {
  it("parses page and rating, dropping invalid values", () => {
    expect(parseReviewsHubQuery({})).toEqual({ page: 1, rating: undefined });
    expect(parseReviewsHubQuery({ page: "3", rating: "5" })).toEqual({ page: 3, rating: 5 });
    expect(parseReviewsHubQuery({ page: "0", rating: "6" })).toEqual({ page: 1, rating: undefined });
    expect(parseReviewsHubQuery({ page: "nope" })).toEqual({ page: 1, rating: undefined });
    expect(parseReviewsHubQuery({ page: ["2", "9"], rating: ["4"] })).toEqual({ page: 2, rating: 4 });
  });

  it("builds filter and pagination hrefs without a page=1 query", () => {
    expect(reviewsHubHref({ page: 1 })).toBe(REVIEWS_HUB_PATH);
    expect(reviewsHubHref({ page: 2, rating: 5 })).toBe("/modempic-reviews?rating=5&page=2");
  });

  it("clamps skip/page against the filtered count", () => {
    expect(reviewsHubSkip(1)).toBe(0);
    expect(reviewsHubSkip(3, 10)).toBe(20);
    expect(clampReviewsHubPage(9, 12, 10)).toBe(2);
    expect(clampReviewsHubPage(0, 12, 10)).toBe(1);
  });

  it("noindexes filtered or paginated views", () => {
    expect(isReviewsHubIndexable({ page: 1 })).toBe(true);
    expect(isReviewsHubIndexable({ page: 2 })).toBe(false);
    expect(isReviewsHubIndexable({ page: 1, rating: 5 })).toBe(false);
  });
});

describe("reviews hub display and schema", () => {
  it("uses authorName, then user name, then the storefront fallback", () => {
    expect(storefrontReviewDisplayName("Alex K", "Account Name")).toBe("Alex K");
    expect(storefrontReviewDisplayName("  ", "Sam")).toBe("Sam");
    expect(storefrontReviewDisplayName(null, null)).toBe("Customer");
  });

  it("rounds averages the same way as product JSON-LD", () => {
    expect(reviewsHubAverage(9, 2)).toBe(4.5);
    expect(roundReviewsHubRating(4.666)).toBe(4.7);
    expect(roundReviewsHubRating(null)).toBe(0);
  });

  it("emits WebPage schema from real approved-review inputs", () => {
    const jsonLd = buildReviewsHubJsonLd({
      name: "Modempic Reviews",
      description: "Approved customer reviews.",
      path: REVIEWS_HUB_PATH,
      baseUrl: "https://modempic.com",
      siteWide: {
        reviewCount: 2,
        averageRating: 4.5,
        breakdown: ratingBreakdownFromCounts({ 5: 1, 4: 1 }),
      },
      reviews: [
        {
          id: "r1",
          rating: 5,
          title: "Arrived packed well",
          body: "Nine days to the mailbox.",
          authorName: "Alex",
          createdAtIso: "2026-08-01T12:00:00.000Z",
          createdAtLabel: "01/08/2026",
          productName: "Modalert 200 mg",
          productSlug: "buy-modalert-200-mg",
        },
      ],
    });

    expect(jsonLd["@type"]).toBe("WebPage");
    expect(jsonLd.url).toBe("https://modempic.com/modempic-reviews");
    expect(jsonLd.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.5,
      reviewCount: 2,
      ratingCount: 2,
      bestRating: 5,
      worstRating: 1,
    });
    expect(jsonLd.review).toHaveLength(1);
    expect(jsonLd.review?.[0].itemReviewed).toEqual({
      "@type": "Product",
      name: "Modalert 200 mg",
      url: "https://modempic.com/product/buy-modalert-200-mg",
    });
  });

  it("omits aggregate and review nodes when the store has no approved reviews", () => {
    const jsonLd = buildReviewsHubJsonLd({
      name: "Modempic Reviews",
      description: "Approved customer reviews.",
      path: REVIEWS_HUB_PATH,
      baseUrl: "https://modempic.com",
      siteWide: { reviewCount: 0, averageRating: 0, breakdown: ratingBreakdownFromCounts({}) },
      reviews: [],
    });
    expect(jsonLd.aggregateRating).toBeUndefined();
    expect(jsonLd.review).toBeUndefined();
  });
});
