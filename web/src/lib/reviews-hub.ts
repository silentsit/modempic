import { buildWebPageJsonLd } from "@/lib/seo/page-json-ld";
import type { RatingBreakdown } from "@/lib/reviews";

export const REVIEWS_HUB_PATH = "/modempic-reviews";
export const REVIEWS_HUB_PAGE_SIZE = 10;
export const REVIEWS_HUB_TITLE = "Modempic reviews";
export const REVIEWS_HUB_DESCRIPTION =
  "Read Modempic reviews from approved customers — star ratings, comments, and the product they bought. These are the same reviews shown on each product page.";

export type ReviewsHubStar = 1 | 2 | 3 | 4 | 5;

export type ReviewsHubQuery = {
  page: number;
  rating?: ReviewsHubStar;
};

export type StorefrontReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  createdAtIso: string;
  createdAtLabel: string;
  productName: string;
  productSlug: string;
};

export type ReviewsHubSiteWide = {
  reviewCount: number;
  averageRating: number;
  breakdown: RatingBreakdown;
};

function firstSearchParam(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

export function parseReviewsHubPage(raw: string | string[] | undefined): number {
  const n = Number.parseInt(firstSearchParam(raw) ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), 10_000);
}

export function parseReviewsHubRating(raw: string | string[] | undefined): ReviewsHubStar | undefined {
  const n = Number.parseInt(firstSearchParam(raw) ?? "", 10);
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n;
  return undefined;
}

export function parseReviewsHubQuery(searchParams: {
  page?: string | string[];
  rating?: string | string[];
}): ReviewsHubQuery {
  return {
    page: parseReviewsHubPage(searchParams.page),
    rating: parseReviewsHubRating(searchParams.rating),
  };
}

export function reviewsHubHref(query: ReviewsHubQuery): string {
  const params = new URLSearchParams();
  if (query.rating) params.set("rating", String(query.rating));
  if (query.page > 1) params.set("page", String(query.page));
  const qs = params.toString();
  return qs ? `${REVIEWS_HUB_PATH}?${qs}` : REVIEWS_HUB_PATH;
}

export function reviewsHubSkip(page: number, pageSize = REVIEWS_HUB_PAGE_SIZE): number {
  return Math.max(0, (page - 1) * pageSize);
}

export function clampReviewsHubPage(page: number, totalCount: number, pageSize = REVIEWS_HUB_PAGE_SIZE): number {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return Math.min(Math.max(1, page), totalPages);
}

export function storefrontReviewDisplayName(
  authorName: string | null | undefined,
  userName: string | null | undefined,
): string {
  return authorName?.trim() || userName?.trim() || "Customer";
}

export function reviewsHubAverage(sum: number, count: number): number {
  if (count <= 0) return 0;
  return Math.round((sum / count) * 10) / 10;
}

export function roundReviewsHubRating(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

export function isReviewsHubIndexable(query: ReviewsHubQuery): boolean {
  return query.page <= 1 && query.rating == null;
}

export function toStorefrontReviewJsonLd(review: StorefrontReview, baseUrl: string) {
  const root = baseUrl.replace(/\/$/, "");
  return {
    "@type": "Review" as const,
    reviewRating: {
      "@type": "Rating" as const,
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: { "@type": "Person" as const, name: review.authorName },
    datePublished: review.createdAtIso.slice(0, 10),
    ...(review.title ? { name: review.title } : {}),
    reviewBody: review.body,
    itemReviewed: {
      "@type": "Product" as const,
      name: review.productName,
      url: `${root}/product/${review.productSlug}`,
    },
  };
}

export function buildReviewsHubJsonLd({
  name,
  description,
  path,
  baseUrl,
  siteWide,
  reviews,
}: {
  name: string;
  description: string;
  path: string;
  baseUrl: string;
  siteWide: ReviewsHubSiteWide;
  reviews: StorefrontReview[];
}) {
  return {
    ...buildWebPageJsonLd({
      name,
      description,
      path,
      baseUrl,
    }),
    ...(siteWide.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating" as const,
            ratingValue: siteWide.averageRating,
            reviewCount: siteWide.reviewCount,
            ratingCount: siteWide.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(reviews.length > 0
      ? { review: reviews.map((review) => toStorefrontReviewJsonLd(review, baseUrl)) }
      : {}),
  };
}
