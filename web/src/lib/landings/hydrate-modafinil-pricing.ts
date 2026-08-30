import { productImageDeliveryUrl } from "@/lib/cloudinary-delivery-url";
import {
  packTierPerPillSavePercent,
  parseVariantTiers,
  tierLabelBaseOnly,
  type VariantTier,
} from "@/lib/product-variants";
import type { LandingPricingRow } from "@/content/landings/where-to-buy-modafinil-online";

export type HydratedPackCell = {
  label: LandingPricingRow["packs"][number];
  priceCents: number | null;
  savePercent: number | null;
};

export type HydratedPricingRow = {
  productSlug: string;
  name: string;
  strength: string;
  href: string;
  imageUrl: string | null;
  imageAlt: string;
  packs: HydratedPackCell[];
};

type PricingSource = {
  slug: string;
  name: string;
  variants: unknown;
  images?: { url: string; alt: string | null; sortOrder: number }[];
  productVariants?: {
    label: string;
    priceCents: number;
    compareAtCents: number | null;
    sortOrder: number;
    active: boolean;
  }[];
};

function tiersFromProduct(product: PricingSource): VariantTier[] {
  const fromTable = (product.productVariants ?? [])
    .filter((variant) => variant.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((variant) => ({
      label: variant.label,
      priceCents: variant.priceCents,
      compareAtCents:
        variant.compareAtCents != null && variant.compareAtCents > variant.priceCents
          ? variant.compareAtCents
          : undefined,
    }));
  if (fromTable.length > 0) return fromTable;
  return parseVariantTiers(product.variants);
}

function packQuantity(label: string): number | null {
  const match = label.trim().match(/^(\d+)\s+pills?$/i);
  if (!match) return null;
  const qty = Number.parseInt(match[1], 10);
  return Number.isFinite(qty) && qty > 0 ? qty : null;
}

function matchPack(tiers: VariantTier[], packLabel: string): { tier: VariantTier; index: number } | null {
  const qty = packQuantity(packLabel);
  if (qty == null) return null;
  const index = tiers.findIndex((tier) => packQuantity(tierLabelBaseOnly(tier.label)) === qty);
  const tier = index >= 0 ? tiers[index] : undefined;
  return tier ? { tier, index } : null;
}

export function hydrateModafinilPricingRows(
  rows: LandingPricingRow[],
  products: PricingSource[],
): HydratedPricingRow[] {
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  return rows.map((row) => {
    const product = bySlug.get(row.productSlug);
    const tiers = product ? tiersFromProduct(product) : [];
    const image = product?.images?.[0];

    return {
      productSlug: row.productSlug,
      name: row.name,
      strength: row.strength,
      href: `/product/${row.productSlug}`,
      imageUrl: image ? productImageDeliveryUrl(image.url, "card") : null,
      imageAlt: image?.alt || `${row.name} ${row.strength}`,
      packs: row.packs.map((label) => {
        const match = matchPack(tiers, label);
        if (!match) return { label, priceCents: null, savePercent: null };
        return {
          label,
          priceCents: match.tier.priceCents,
          savePercent: packTierPerPillSavePercent(tiers, match.index),
        };
      }),
    };
  });
}
