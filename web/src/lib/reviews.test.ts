import { describe, expect, it } from "vitest";
import { computeRatingBreakdown, filterProductReviews, sortProductReviews } from "./reviews";

describe("computeRatingBreakdown", () => {
  it("returns percentage distribution across star levels", () => {
    const breakdown = computeRatingBreakdown([
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
      { rating: 1 },
    ]);
    expect(breakdown[5]).toEqual({ count: 2, percent: 50 });
    expect(breakdown[4]).toEqual({ count: 1, percent: 25 });
    expect(breakdown[1]).toEqual({ count: 1, percent: 25 });
    expect(breakdown[3].percent).toBe(0);
  });
});

describe("filterProductReviews", () => {
  const reviews = [
    { id: "1", rating: 5, title: "Great", body: "Best price", authorName: "Alex", createdAtIso: "2024-01-02" },
    { id: "2", rating: 4, title: null, body: "Fast shipping", authorName: "Sam", createdAtIso: "2024-01-01" },
  ];

  it("filters by body, title, and author", () => {
    expect(filterProductReviews(reviews, "price")).toHaveLength(1);
    expect(filterProductReviews(reviews, "sam")).toHaveLength(1);
    expect(filterProductReviews(reviews, "")).toHaveLength(2);
  });
});

describe("sortProductReviews", () => {
  const reviews = [
    { id: "1", rating: 3, createdAtIso: "2024-01-01" },
    { id: "2", rating: 5, createdAtIso: "2024-02-01" },
    { id: "3", rating: 5, createdAtIso: "2024-03-01" },
  ];

  it("sorts by recency, rating, and age", () => {
    expect(sortProductReviews(reviews, "recent").map((r) => r.id)).toEqual(["3", "2", "1"]);
    expect(sortProductReviews(reviews, "oldest").map((r) => r.id)).toEqual(["1", "2", "3"]);
    expect(sortProductReviews(reviews, "highest")[0].id).toBe("3");
    expect(sortProductReviews(reviews, "lowest")[0].id).toBe("1");
  });
});
