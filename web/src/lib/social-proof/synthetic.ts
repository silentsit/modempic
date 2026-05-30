import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatPurchaseDisplayName, truncateProductHint } from "./anonymize";
import { formatTimeAgo } from "./format-time-ago";
import type { SocialProofActivityItemDto } from "./queries";

export type SyntheticProductRef = {
  name: string;
  slug: string;
  imageUrl?: string;
};

const SYNTHETIC_FULL_NAMES = [
  "Alex Rivera",
  "Jordan Chen",
  "Sam Patel",
  "Taylor Brooks",
  "Morgan Lee",
  "Casey Nguyen",
  "Riley Johnson",
  "Quinn Martinez",
  "Avery Williams",
  "Blake Anderson",
  "Drew Thompson",
  "Jamie Garcia",
  "Skyler Davis",
  "Reese Wilson",
  "Cameron Brown",
  "Parker Miller",
  "Hayden Clark",
  "Logan Wright",
  "Emery Scott",
  "Finley Adams",
] as const;

const SYNTHETIC_LOCATIONS = [
  { city: "Phoenix", state: "AZ" },
  { city: "Austin", state: "TX" },
  { city: "Denver", state: "CO" },
  { city: "Seattle", state: "WA" },
  { city: "Portland", state: "OR" },
  { city: "Nashville", state: "TN" },
  { city: "Charlotte", state: "NC" },
  { city: "San Diego", state: "CA" },
  { city: "Minneapolis", state: "MN" },
  { city: "Atlanta", state: "GA" },
  { city: "Boston", state: "MA" },
  { city: "Chicago", state: "IL" },
] as const;

type ActivityKind = "order_completed" | "order_product" | "signup";

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickKind(): ActivityKind {
  const roll = Math.random();
  if (roll < 0.8) return "order_product";
  if (roll < 0.95) return "order_completed";
  return "signup";
}

function randomMinutesAgo(maxMinutes: number): Date {
  const minutes = 12 + Math.floor(Math.random() * Math.max(1, maxMinutes - 12));
  return new Date(Date.now() - minutes * 60 * 1000);
}

function composeSyntheticItem(
  displayName: string,
  locationLine: string | null,
  actionLine: string,
  completedAt: Date,
  productHint?: string,
  productSlug?: string,
  productImageUrl?: string,
): SocialProofActivityItemDto {
  const loc = locationLine ? ` from ${locationLine}` : "";
  const message = productHint
    ? `${displayName}${loc} just purchased`
    : `${displayName}${loc} ${actionLine}`;
  return {
    message,
    completedAtIso: completedAt.toISOString(),
    timeLabel: formatTimeAgo(completedAt),
    displayName,
    actionLine,
    locationLine,
    ...(productHint ? { productHint } : {}),
    ...(productSlug ? { productSlug } : {}),
    ...(productImageUrl ? { productImageUrl } : {}),
    synthetic: true,
  };
}

function actionForKind(
  kind: ActivityKind,
  product?: SyntheticProductRef,
): { actionLine: string; productHint?: string; productSlug?: string; productImageUrl?: string } {
  switch (kind) {
    case "order_product":
      if (product?.name) {
        const hint = truncateProductHint(product.name);
        return {
          actionLine: "just purchased",
          productHint: hint,
          productSlug: product.slug,
          productImageUrl: product.imageUrl,
        };
      }
      return { actionLine: "just completed an order" };
    case "signup":
      return { actionLine: "just signed up" };
    case "order_completed":
    default:
      return { actionLine: "just completed an order" };
  }
}

export async function fetchRandomPublishedProducts(take = 12): Promise<SyntheticProductRef[]> {
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
      take: Math.min(50, Math.max(take * 3, 12)),
      orderBy: { updatedAt: "desc" },
    });
    const products = rows.map((r) => ({
      name: r.name.trim(),
      slug: r.slug,
      imageUrl: r.images[0]?.url,
    }));
    if (products.length <= take) return products.filter((p) => p.name);
    return [...products].sort(() => Math.random() - 0.5).slice(0, take);
  } catch {
    return [];
  }
}

/** @deprecated use fetchRandomPublishedProducts */
export async function fetchRandomPublishedProductTitles(take = 12): Promise<string[]> {
  const products = await fetchRandomPublishedProducts(take);
  return products.map((p) => p.name);
}

export async function generateSyntheticActivity(options: {
  count?: number;
  windowDays?: number;
  showLocation?: boolean;
  products?: SyntheticProductRef[];
}): Promise<SocialProofActivityItemDto[]> {
  const count = Math.min(25, Math.max(8, options.count ?? 12));
  const windowDays = options.windowDays ?? 7;
  const maxMinutes = windowDays * 24 * 60;
  const showLocation = options.showLocation !== false;
  const products =
    options.products?.length ? options.products : await fetchRandomPublishedProducts(count);

  const items: SocialProofActivityItemDto[] = [];
  for (let i = 0; i < count; i++) {
    const displayName = formatPurchaseDisplayName(pickRandom(SYNTHETIC_FULL_NAMES));
    let locationLine: string | null = null;
    if (showLocation) {
      const loc = pickRandom(SYNTHETIC_LOCATIONS);
      locationLine = `${loc.city}, ${loc.state}`;
    }
    let kind = pickKind();
    if (kind === "order_product" && !products.length) {
      kind = "order_completed";
    }
    const product = kind === "order_product" ? pickRandom(products) : undefined;
    const { actionLine, productHint, productSlug, productImageUrl } = actionForKind(kind, product);
    items.push(
      composeSyntheticItem(
        displayName,
        locationLine,
        actionLine,
        randomMinutesAgo(maxMinutes),
        productHint,
        productSlug,
        productImageUrl,
      ),
    );
  }
  return items.sort((a, b) => Date.parse(b.completedAtIso) - Date.parse(a.completedAtIso));
}
