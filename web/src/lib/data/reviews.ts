import { format } from "date-fns";
import { OrderStatus, ProductStatus, ReviewStatus, Role, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";
import { LEGACY_CATEGORY_REDIRECTS, STOREFRONT_CATEGORIES } from "@/lib/catalog/storefront-categories";
import { ratingBreakdownFromCounts } from "@/lib/reviews";
import {
  clampReviewsHubPage,
  REVIEWS_HUB_PAGE_SIZE,
  reviewsHubSkip,
  roundReviewsHubRating,
  storefrontReviewDisplayName,
  type ReviewsHubQuery,
  type ReviewsHubSiteWide,
  type StorefrontReview,
} from "@/lib/reviews-hub";

export type ProductReviewEligibility = {
  isSignedIn: boolean;
  canSubmit: boolean;
  canUseCustomName?: boolean;
  reason?: "sign_in" | "purchase_required" | "already_reviewed";
  existingStatus?: ReviewStatus;
};

export async function getProductReviewEligibility(
  userId: string | undefined,
  productId: string,
  userRole?: Role,
): Promise<ProductReviewEligibility> {
  if (!userId) {
    return { isSignedIn: false, canSubmit: false, reason: "sign_in" };
  }

  if (userRole === Role.ADMIN) {
    return { isSignedIn: true, canSubmit: true, canUseCustomName: true };
  }

  return prismaDevOr(
    "getProductReviewEligibility",
    async () => {
      const existing = await prisma.review.findFirst({
        where: { userId, productId },
        select: { status: true },
      });
      if (existing) {
        return {
          isSignedIn: true,
          canSubmit: false,
          reason: "already_reviewed" as const,
          existingStatus: existing.status,
        };
      }

      const purchased = await prisma.orderLine.findFirst({
        where: {
          productId,
          order: { userId, status: OrderStatus.COMPLETED },
        },
        select: { id: true },
      });

      if (!purchased) {
        return { isSignedIn: true, canSubmit: false, reason: "purchase_required" };
      }

      return { isSignedIn: true, canSubmit: true };
    },
    { isSignedIn: true, canSubmit: false, reason: "purchase_required" as const },
  );
}

const visibleCategorySlugs = [
  ...STOREFRONT_CATEGORIES.map((category) => category.slug),
  ...Object.keys(LEGACY_CATEGORY_REDIRECTS),
];

function storefrontReviewProductWhere(): Prisma.ProductWhereInput {
  return {
    status: ProductStatus.PUBLISHED,
    OR: [
      { categories: { none: {} } },
      { categories: { some: { category: { slug: { in: visibleCategorySlugs } } } } },
    ],
  };
}

function approvedStorefrontReviewWhere(rating?: ReviewsHubQuery["rating"]): Prisma.ReviewWhereInput {
  return {
    status: ReviewStatus.APPROVED,
    product: storefrontReviewProductWhere(),
    ...(rating ? { rating } : {}),
  };
}

const emptyBreakdown = ratingBreakdownFromCounts({});

const emptyHubPage = {
  reviews: [] as StorefrontReview[],
  page: 1,
  pageSize: REVIEWS_HUB_PAGE_SIZE,
  totalCount: 0,
  totalPages: 1,
  ratingFilter: undefined as ReviewsHubQuery["rating"],
  siteWide: {
    reviewCount: 0,
    averageRating: 0,
    breakdown: emptyBreakdown,
  } satisfies ReviewsHubSiteWide,
};

export type ReviewsHubPage = {
  reviews: StorefrontReview[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  ratingFilter: ReviewsHubQuery["rating"];
  siteWide: ReviewsHubSiteWide;
};

const storefrontReviewSelect = {
  id: true,
  rating: true,
  title: true,
  body: true,
  authorName: true,
  createdAt: true,
  user: { select: { name: true } },
  product: { select: { name: true, slug: true } },
} satisfies Prisma.ReviewSelect;

function mapStorefrontReview(row: {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string | null;
  createdAt: Date;
  user: { name: string | null };
  product: { name: string; slug: string };
}): StorefrontReview {
  return {
    id: row.id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    authorName: storefrontReviewDisplayName(row.authorName, row.user.name),
    createdAtIso: row.createdAt.toISOString(),
    createdAtLabel: format(row.createdAt, "dd/MM/yyyy"),
    productName: row.product.name,
    productSlug: row.product.slug,
  };
}

export async function getReviewsHubPage(query: ReviewsHubQuery): Promise<ReviewsHubPage> {
  return prismaDevOr(
    "getReviewsHubPage",
    async () => {
      const listWhere = approvedStorefrontReviewWhere(query.rating);
      const siteWideWhere = approvedStorefrontReviewWhere();

      const [totalCount, siteWideAgg, ratingGroups] = await Promise.all([
        prisma.review.count({ where: listWhere }),
        prisma.review.aggregate({
          where: siteWideWhere,
          _avg: { rating: true },
          _count: { id: true },
        }),
        prisma.review.groupBy({
          by: ["rating"],
          where: siteWideWhere,
          _count: { id: true },
        }),
      ]);

      const page = clampReviewsHubPage(query.page, totalCount);
      const rows = await prisma.review.findMany({
        where: listWhere,
        orderBy: { createdAt: "desc" },
        skip: reviewsHubSkip(page),
        take: REVIEWS_HUB_PAGE_SIZE,
        select: storefrontReviewSelect,
      });

      const counts: Partial<Record<number, number>> = {};
      for (const group of ratingGroups) {
        const star = Math.min(5, Math.max(1, Math.round(group.rating)));
        counts[star] = (counts[star] ?? 0) + group._count.id;
      }

      const reviewCount = siteWideAgg._count.id;

      return {
        reviews: rows.map(mapStorefrontReview),
        page,
        pageSize: REVIEWS_HUB_PAGE_SIZE,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / REVIEWS_HUB_PAGE_SIZE)),
        ratingFilter: query.rating,
        siteWide: {
          reviewCount,
          averageRating: reviewCount > 0 ? roundReviewsHubRating(siteWideAgg._avg.rating) : 0,
          breakdown: ratingBreakdownFromCounts(counts),
        },
      };
    },
    emptyHubPage,
  );
}
