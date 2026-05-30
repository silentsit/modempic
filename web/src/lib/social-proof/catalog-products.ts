import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  publishedProductMatches,
  type PublishedProductRef,
} from "./catalog-product-matching";
import type { SocialProofActivityItemDto } from "./queries";

export type { PublishedProductRef } from "./catalog-product-matching";

function stripProductFromActivityItem(item: SocialProofActivityItemDto): SocialProofActivityItemDto {
  const loc = item.locationLine ? ` from ${item.locationLine}` : "";
  const actionLine = "just completed an order";
  return {
    message: `${item.displayName}${loc} just completed an order`,
    completedAtIso: item.completedAtIso,
    timeLabel: item.timeLabel,
    displayName: item.displayName,
    actionLine,
    locationLine: item.locationLine ?? null,
    synthetic: item.synthetic,
  };
}

export async function fetchPublishedProductCatalog(): Promise<PublishedProductRef[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { status: ProductStatus.PUBLISHED },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    });
    return rows
      .map((r) => ({ slug: r.slug, name: r.name.trim() }))
      .filter((r) => r.name);
  } catch {
    return [];
  }
}

/** Drop or genericize product copy when the item is not a published Modempic product. */
export async function sanitizeActivityItemsToPublishedCatalog(
  items: SocialProofActivityItemDto[],
): Promise<SocialProofActivityItemDto[]> {
  const needsProductCheck = items.some((item) => item.productHint || item.productSlug);
  if (!needsProductCheck) return items;

  const catalog = await fetchPublishedProductCatalog();
  if (!catalog.length) {
    return items.map((item) =>
      item.productHint || item.productSlug ? stripProductFromActivityItem(item) : item,
    );
  }

  return items.map((item) => {
    if (!item.productHint && !item.productSlug) return item;
    if (
      publishedProductMatches(catalog, {
        productSlug: item.productSlug,
        productHint: item.productHint,
      })
    ) {
      return item;
    }
    return stripProductFromActivityItem(item);
  });
}
