import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { truncateProductHint } from "./anonymize";
import { formatAggregateWindow, getSocialProofDisplayCount } from "./display-count";
import type { SyntheticProductRef } from "./synthetic";

export type ComboSlideDto = {
  count: number;
  hours: number;
  windowLabel: string;
  productHint?: string;
  productSlug?: string;
  productImageUrl?: string;
};

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

/** Generate 2–4 product purchase aggregates with synthetic counts (7–300). */
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

/** Site-wide combo plus 2–3 product purchase combos for rotation (synthetic 7–300). */
export async function generateComboSlides(options: {
  comboNotificationId: string;
  aggregateHours?: number;
  products?: SyntheticProductRef[];
}): Promise<ComboSlideDto[]> {
  const hours = options.aggregateHours ?? 24;
  const id = options.comboNotificationId;
  const slides: ComboSlideDto[] = [
    {
      count: getSocialProofDisplayCount(`combo:${id}`),
      hours,
      windowLabel: formatAggregateWindow(hours),
    },
  ];

  const products = options.products?.length ? options.products : await loadProducts();
  if (!products.length) return slides;

  const productCount = 2 + (getSocialProofDisplayCount(`combo-n:${id}`) % 2);
  const shuffled = [...products].sort(
    (a, b) =>
      getSocialProofDisplayCount(`combo:${a.slug}:${b.slug}`) -
      getSocialProofDisplayCount(`combo:${b.slug}:${a.slug}`),
  );

  for (let i = 0; i < Math.min(productCount, shuffled.length); i++) {
    const product = shuffled[i]!;
    const window = WINDOW_OPTIONS[(i + 1) % WINDOW_OPTIONS.length]!;
    const hint = truncateProductHint(product.name);
    const seed = `combo-product:${id}:${product.slug}:${window.hours}`;
    slides.push({
      count: getSocialProofDisplayCount(seed),
      hours: window.hours,
      windowLabel: window.label,
      productHint: hint,
      productSlug: product.slug,
      ...(product.imageUrl ? { productImageUrl: product.imageUrl } : {}),
    });
  }

  return slides;
}
