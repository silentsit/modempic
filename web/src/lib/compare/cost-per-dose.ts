import {
  parseVariantTiers,
  tierLabelBaseOnly,
  tierLabelLeadingQuantity,
  type VariantTier,
} from "@/lib/product-variants";

const REFERENCE_MG = 200;

export function tiersForCompare(product: {
  variants: unknown;
  productVariants?: Array<{
    label: string;
    priceCents: number;
    compareAtCents: number | null;
    sortOrder: number;
    active: boolean;
  }>;
}): VariantTier[] {
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

export function packQuantityFromLabel(label: string): number | null {
  return tierLabelLeadingQuantity(tierLabelBaseOnly(label));
}

/** USD cents for a 200 mg-equivalent tablet, using the cheapest pack that has a pill count. */
export function costPer200mgCents(tiers: VariantTier[], strengthMg: number | null | undefined): number | null {
  if (strengthMg == null || strengthMg <= 0) return null;
  let lowest: number | null = null;
  for (const tier of tiers) {
    const qty = packQuantityFromLabel(tier.label);
    if (qty == null || qty <= 0 || tier.priceCents <= 0) continue;
    const perTablet = tier.priceCents / qty;
    const per200 = Math.round(perTablet * (REFERENCE_MG / strengthMg));
    if (lowest == null || per200 < lowest) lowest = per200;
  }
  return lowest;
}

export function costPerTabletCents(tiers: VariantTier[]): number | null {
  let lowest: number | null = null;
  for (const tier of tiers) {
    const qty = packQuantityFromLabel(tier.label);
    if (qty == null || qty <= 0 || tier.priceCents <= 0) continue;
    const unit = Math.round(tier.priceCents / qty);
    if (lowest == null || unit < lowest) lowest = unit;
  }
  return lowest;
}
