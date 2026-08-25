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
  "mailbox",
  "days",
] as const;

const STALE_OR_INCOMPLETE_PATTERNS = [
  /\bonly payment\b/i,
  /\bcrypto only\b/i,
  /\bwill post another review\b/i,
  /\bnoofox\b/i,
  /\bsharkmood\b/i,
  /\bmodaboost\b/i,
  /\bunbeatable prices\b/i,
  /\bbuy\s+\w+\s+at\b/i,
] as const;

/** Keep quotes short and readable for equal homepage cards. */
export function humanizeQuote(body: string, maxLength = 150) {
  let quote = body
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#8211;/gi, "-")
    .replace(/&#8217;/gi, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  // Drop trailing filler that reads like marketing paste.
  quote = quote
    .replace(/\b(highly recommend!+|will (definitely )?be back!+|a\+{3,})\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (quote.length <= maxLength) return quote;

  const slice = quote.slice(0, maxLength);
  const sentenceEnd = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  if (sentenceEnd >= 60) return slice.slice(0, sentenceEnd + 1).trim();

  const wordBreak = slice.lastIndexOf(" ");
  const cut = wordBreak > 40 ? slice.slice(0, wordBreak) : slice;
  return `${cut.trimEnd()}...`;
}

function displayName(authorName: string | null | undefined, userName: string | null | undefined) {
  const raw = authorName?.trim() || userName?.trim();
  if (!raw) return "Customer";
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 20);
  return `${parts[0]} ${parts.at(-1)?.charAt(0).toUpperCase()}.`;
}

function experienceScore(body: string) {
  const normalized = body.toLowerCase();
  const termScore = EXPERIENCE_TERMS.reduce(
    (score, term) => score + (normalized.includes(term) ? 3 : 0),
    0,
  );
  // Prefer punchy notes that fit equal cards without heavy truncation.
  const lengthScore = body.length >= 45 && body.length <= 220 ? 4 : body.length <= 320 ? 1 : 0;
  return termScore + lengthScore;
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
          take: 40,
          select,
        }),
        prisma.review.findMany({
          where: {
            status: ReviewStatus.APPROVED,
            rating: { gte: 4 },
            product: { status: ProductStatus.PUBLISHED },
          },
          orderBy: { createdAt: "desc" },
          take: 40,
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
          quote: humanizeQuote(row.body),
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
