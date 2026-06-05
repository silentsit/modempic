import { findVariantByKey, tiersFromProduct, type VariantTierSource } from "@/lib/catalog/product-variant-store";
import { tierLabelBaseOnly } from "@/lib/product-variants";

export type ResolvedCartVariant = {
  unitPriceCents: number;
  variantKey: string;
  variantId?: string;
};

type ProductForCartVariant = {
  priceCents: number;
  variants: unknown;
  productVariants?: VariantTierSource[];
  name?: string;
};

/** Subset used when resolving tier labels (price not required). */
export type ProductForTierLabel = Pick<ProductForCartVariant, "variants" | "productVariants" | "name">;

function activeVariants(product: { productVariants?: VariantTierSource[] }): VariantTierSource[] {
  return (product.productVariants ?? [])
    .filter((v) => v.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function withVariantId(
  product: ProductForCartVariant,
  unitPriceCents: number,
  variantKey: string,
): ResolvedCartVariant {
  const variant = findVariantByKey(activeVariants(product), variantKey);
  return { unitPriceCents, variantKey, variantId: variant?.id };
}

const REJECT = { error: "CART_REJECTED" as const };

/**
 * Resolves server-side unit price and cart line key from product data and optional tier index.
 * Never trust a client-posted price; only the index is accepted for multi-tier products.
 */
export function resolveCartVariantFromTierIndex(
  product: ProductForCartVariant,
  tierIndexRaw: unknown,
): ResolvedCartVariant | typeof REJECT {
  const tiers = tiersFromProduct(product);
  if (tiers.length === 0) {
    if (tierIndexRaw != null && String(tierIndexRaw).trim() !== "") return REJECT;
    return withVariantId(product, product.priceCents, "");
  }
  if (tiers.length === 1) {
    if (tierIndexRaw != null && String(tierIndexRaw).trim() !== "" && Number(tierIndexRaw) !== 0) {
      return REJECT;
    }
    return withVariantId(product, tiers[0].priceCents, "");
  }
  const raw = tierIndexRaw == null || tierIndexRaw === "" ? NaN : Number(tierIndexRaw);
  if (!Number.isInteger(raw) || raw < 0 || raw >= tiers.length) return REJECT;
  return withVariantId(product, tiers[raw].priceCents, `t${raw}`);
}

/** Used when adding from listings / quick buy with no explicit tier: cheapest tier for multi-pack products. */
export function defaultCartVariantForListings(product: ProductForCartVariant): ResolvedCartVariant {
  const tiers = tiersFromProduct(product);
  if (tiers.length === 0) return withVariantId(product, product.priceCents, "");
  if (tiers.length === 1) return withVariantId(product, tiers[0].priceCents, "");
  let bestI = 0;
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].priceCents < tiers[bestI].priceCents) bestI = i;
  }
  return withVariantId(product, tiers[bestI].priceCents, `t${bestI}`);
}

export function tierLabelForVariantKey(
  product: ProductForTierLabel,
  variantKey: string,
  variant?: Pick<VariantTierSource, "label"> | null,
): string | null {
  if (variant?.label?.trim()) return tierLabelBaseOnly(variant.label);
  const variantRow = findVariantByKey(activeVariants(product), variantKey);
  if (variantRow?.label?.trim()) return tierLabelBaseOnly(variantRow.label);
  const tiers = tiersFromProduct(product);
  const m = /^t(\d+)$/.exec(variantKey);
  if (!m) return variantKey === "" ? null : null;
  const i = Number(m[1]);
  const label = tiers[i]?.label?.trim();
  if (!label) return null;
  return tierLabelBaseOnly(label);
}
