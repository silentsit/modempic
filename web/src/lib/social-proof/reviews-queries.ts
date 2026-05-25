import { ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type SocialProofReviewDto = {
  id: string;
  authorName: string;
  rating: number;
  title?: string;
  excerpt: string;
  productName?: string;
  productSlug?: string;
  productImageUrl?: string;
  createdAtIso: string;
};

const MAX_TAKE = 15;
const MAX_WINDOW_DAYS = 90;

function clampWindowDays(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 30;
  return Math.min(Math.floor(n), MAX_WINDOW_DAYS);
}

function clampTake(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 8;
  return Math.min(Math.floor(n), MAX_TAKE);
}

function daysAgo(d: Date, days: number): Date {
  const t = new Date(d);
  t.setUTCDate(t.getUTCDate() - days);
  return t;
}

function excerptBody(body: string, maxLen = 120): string {
  const t = body.trim().replace(/\s+/g, " ");
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1).trim()}…`;
}

export async function fetchApprovedReviewsForSocialProof(options: {
  windowDays?: number;
  take?: number;
  minRating?: number;
  now?: Date;
}): Promise<SocialProofReviewDto[]> {
  const now = options.now ?? new Date();
  const windowDays = clampWindowDays(options.windowDays ?? 30);
  const take = clampTake(options.take ?? 8);
  const minRating = Math.min(5, Math.max(1, Math.floor(options.minRating ?? 4)));
  const since = daysAgo(now, windowDays);

  const rows = await prisma.review.findMany({
    where: {
      status: ReviewStatus.APPROVED,
      rating: { gte: minRating },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      authorName: true,
      createdAt: true,
      user: { select: { name: true } },
      product: {
        select: {
          name: true,
          slug: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  });

  return rows.map((row) => {
    const imageUrl = row.product.images[0]?.url;
    return {
      id: row.id,
      authorName: row.authorName?.trim() || row.user.name?.trim() || "Verified customer",
      rating: row.rating,
      ...(row.title?.trim() ? { title: row.title.trim() } : {}),
      excerpt: excerptBody(row.body),
      productName: row.product.name,
      productSlug: row.product.slug,
      ...(imageUrl ? { productImageUrl: imageUrl } : {}),
      createdAtIso: row.createdAt.toISOString(),
    };
  });
}
