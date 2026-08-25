import { ProductStatus, ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";

export type HomepageTestimonial = {
  id: string;
  quote: string;
  name: string;
  rating: number;
  productName: string;
  productSlug: string;
};

type TestimonialCandidate = HomepageTestimonial & { createdAt: Date };

const EXPERIENCE_TERMS = [
  "deliver",
  "shipping",
  "arriv",
  "receiv",
  "packag",
  "support",
  "service",
  "tracking",
] as const;

const STALE_OR_INCOMPLETE_PATTERNS = [
  /\bonly payment\b/i,
  /\bcrypto only\b/i,
  /\bwill post another review\b/i,
  /\bnoofox\b/i,
  /\bsharkmood\b/i,
  /\bmodaboost\b/i,
] as const;

function cleanQuote(body: string, maxLength = 360) {
  const quote = body.replace(/\s+/g, " ").trim();
  if (quote.length <= maxLength) return quote;
  return `${quote.slice(0, maxLength - 1).trimEnd()}…`;
}

function displayName(authorName: string | null | undefined, userName: string | null | undefined) {
  const raw = authorName?.trim() || userName?.trim();
  if (!raw) return "Verified customer";
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 24);
  return `${parts[0]} ${parts.at(-1)?.charAt(0).toUpperCase()}.`;
}

function experienceScore(body: string) {
  const normalized = body.toLowerCase();
  const termScore = EXPERIENCE_TERMS.reduce(
    (score, term) => score + (normalized.includes(term) ? 3 : 0),
    0,
  );
  const detailScore = body.length >= 70 && body.length <= 320 ? 2 : 0;
  return termScore + detailScore;
}

/** Prefer varied products so one heavily reviewed item cannot dominate the homepage. */
export function selectHomepageTestimonials(
  candidates: TestimonialCandidate[],
  limit = 5,
): HomepageTestimonial[] {
  const selected: HomepageTestimonial[] = [];
  const productIds = new Set<string>();

  for (const candidate of candidates) {
    if (selected.length >= limit) break;
    if (productIds.has(candidate.productSlug)) continue;
    productIds.add(candidate.productSlug);
    const { createdAt: _createdAt, ...testimonial } = candidate;
    void _createdAt;
    selected.push(testimonial);
  }

  return selected;
}

export async function getHomepageTestimonials(limit = 5): Promise<HomepageTestimonial[]> {
  return prismaDevOr(
    "getHomepageTestimonials",
    async () => {
      const experienceFilters = EXPERIENCE_TERMS.map((term) => ({
        body: { contains: term, mode: "insensitive" as const },
      }));

      const select = {
        id: true,
        body: true,
        authorName: true,
        rating: true,
        createdAt: true,
        user: { select: { name: true } },
        product: { select: { name: true, slug: true } },
      } as const;

      const [experienceRows, recentRows] = await Promise.all([
        prisma.review.findMany({
          where: {
            status: ReviewStatus.APPROVED,
            rating: { gte: 4 },
            product: { status: ProductStatus.PUBLISHED },
            OR: experienceFilters,
          },
          orderBy: { createdAt: "desc" },
          take: 30,
          select,
        }),
        prisma.review.findMany({
          where: {
            status: ReviewStatus.APPROVED,
            rating: { gte: 4 },
            product: { status: ProductStatus.PUBLISHED },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
          select,
        }),
      ]);

      const seen = new Set<string>();
      const candidates = [...experienceRows, ...recentRows]
        .filter((row) => {
          if (seen.has(row.id)) return false;
          seen.add(row.id);
          const body = row.body.trim();
          return (
            body.length >= 35 &&
            !STALE_OR_INCOMPLETE_PATTERNS.some((pattern) => pattern.test(body))
          );
        })
        .map((row) => ({
          id: row.id,
          quote: cleanQuote(row.body),
          name: displayName(row.authorName, row.user.name),
          rating: Math.min(5, Math.max(1, row.rating)),
          productName: row.product.name,
          productSlug: row.product.slug,
          createdAt: row.createdAt,
          score: experienceScore(row.body),
        }))
        .sort((a, b) => b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime())
        .map(({ score: _score, ...candidate }) => {
          void _score;
          return candidate;
        });

      return selectHomepageTestimonials(candidates, limit);
    },
    [],
  );
}
