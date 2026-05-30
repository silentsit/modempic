import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { truncateProductHint } from "./anonymize";
import { getSocialProofDisplayCount } from "./display-count";
import type { SyntheticProductRef } from "./synthetic";

export type StreamAggregateDto = {
  count: number;
  productHint: string;
  productSlug?: string;
  productImageUrl?: string;
  windowLabel: string;
  windowHours: number;
};

const WINDOW_OPTIONS = [
  { hours: 24, label: "24 hours" },
  { hours: 168, label: "7 days" },
  { hours: 720, label: "30 days" },
] as const;

function pickCount(seed: string): number {
  return getSocialProofDisplayCount(`aggregate:${seed}`);
}

async function loadProducts(): Promise<SyntheticProductRef[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { status: ProductStatus.PUBLISHED },
      select: {
        name: true,
        slug: true,
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { url: true },
        },
      },
      take: 30,
      orderBy: { updatedAt: "desc" },
    });
    return rows
      .map((r) => ({
        name: r.name.trim(),
        slug: r.slug,
        imageUrl: r.images[0]?.url,
      }))
      .filter((p) => p.name);
  } catch {
    return [];
  }
}

/** Generate 2–4 product purchase aggregates with synthetic counts (50–999). */
export async function generateStreamAggregates(options?: {
  products?: SyntheticProductRef[];
  streamNotificationId?: string;
}): Promise<StreamAggregateDto[]> {
  const products = options?.products?.length ? options.products : await loadProducts();
  if (!products.length) return [];

  const count = 2 + (getSocialProofDisplayCount(`agg-n:${options?.streamNotificationId ?? "default"}`) % 3);
  const shuffled = [...products].sort(
    (a, b) =>
      getSocialProofDisplayCount(`${a.slug}:${b.slug}`) -
      getSocialProofDisplayCount(`${b.slug}:${a.slug}`),
  );

  const aggregates: StreamAggregateDto[] = [];
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const product = shuffled[i]!;
    const window = WINDOW_OPTIONS[i % WINDOW_OPTIONS.length]!;
    const hint = truncateProductHint(product.name);
    const seed = `${options?.streamNotificationId ?? "stream"}:${product.slug}:${window.hours}`;
    aggregates.push({
      count: pickCount(seed),
      productHint: hint,
      productSlug: product.slug,
      ...(product.imageUrl ? { productImageUrl: product.imageUrl } : {}),
      windowLabel: window.label,
      windowHours: window.hours,
    });
  }
  return aggregates;
}
