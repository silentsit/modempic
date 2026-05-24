export type ProductReviewSort = "recent" | "oldest" | "highest" | "lowest";

export type RatingBreakdown = Record<1 | 2 | 3 | 4 | 5, { count: number; percent: number }>;

/** Approved-review histogram for the summary panel (percentages sum to 100 when count > 0). */
export function computeRatingBreakdown(reviews: { rating: number }[]): RatingBreakdown {
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    counts[star] += 1;
  }
  const total = reviews.length;
  return {
    5: { count: counts[5], percent: total ? Math.round((counts[5] / total) * 100) : 0 },
    4: { count: counts[4], percent: total ? Math.round((counts[4] / total) * 100) : 0 },
    3: { count: counts[3], percent: total ? Math.round((counts[3] / total) * 100) : 0 },
    2: { count: counts[2], percent: total ? Math.round((counts[2] / total) * 100) : 0 },
    1: { count: counts[1], percent: total ? Math.round((counts[1] / total) * 100) : 0 },
  };
}

export function sortProductReviews<T extends { rating: number; createdAtIso: string }>(
  reviews: T[],
  sort: ProductReviewSort,
): T[] {
  const copy = [...reviews];
  copy.sort((a, b) => {
    if (sort === "highest") return b.rating - a.rating || b.createdAtIso.localeCompare(a.createdAtIso);
    if (sort === "lowest") return a.rating - b.rating || b.createdAtIso.localeCompare(a.createdAtIso);
    if (sort === "oldest") return a.createdAtIso.localeCompare(b.createdAtIso);
    return b.createdAtIso.localeCompare(a.createdAtIso);
  });
  return copy;
}

export function filterProductReviews<T extends { body: string; title: string | null; authorName: string | null }>(
  reviews: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return reviews;
  return reviews.filter((r) => {
    const haystack = [r.body, r.title ?? "", r.authorName ?? ""].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}
