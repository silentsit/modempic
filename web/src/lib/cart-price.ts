import { parseVariantTiers } from "@/lib/product-variants";

export type ResolvedCartVariant = {
  unitPriceCents: number;
  variantKey: string;
};

const REJECT = { error: "CART_REJECTED" as const };

/**
 * Resolves server-side unit price and cart line key from product data and optional tier index.
 * Never trust a client-posted price; only the index is accepted for multi-tier products.
 */
export function resolveCartVariantFromTierIndex(
  product: { priceCents: number; variants: unknown },
  tierIndexRaw: unknown,
): ResolvedCartVariant | typeof REJECT {
  const tiers = parseVariantTiers(product.variants);
  if (tiers.length === 0) {
    if (tierIndexRaw != null && String(tierIndexRaw).trim() !== "") return REJECT;
    return { unitPriceCents: product.priceCents, variantKey: "" };
  }
  if (tiers.length === 1) {
    if (tierIndexRaw != null && String(tierIndexRaw).trim() !== "" && Number(tierIndexRaw) !== 0) {
      return REJECT;
    }
    return { unitPriceCents: tiers[0].priceCents, variantKey: "" };
  }
  const raw = tierIndexRaw == null || tierIndexRaw === "" ? NaN : Number(tierIndexRaw);
  if (!Number.isInteger(raw) || raw < 0 || raw >= tiers.length) return REJECT;
  return { unitPriceCents: tiers[raw].priceCents, variantKey: `t${raw}` };
}

/** Used when adding from listings / quick buy with no explicit tier: cheapest tier for multi-pack products. */
export function defaultCartVariantForListings(product: { priceCents: number; variants: unknown }): ResolvedCartVariant {
  const tiers = parseVariantTiers(product.variants);
  if (tiers.length === 0) return { unitPriceCents: product.priceCents, variantKey: "" };
  if (tiers.length === 1) return { unitPriceCents: tiers[0].priceCents, variantKey: "" };
  let bestI = 0;
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].priceCents < tiers[bestI].priceCents) bestI = i;
  }
  return { unitPriceCents: tiers[bestI].priceCents, variantKey: `t${bestI}` };
}

export function tierLabelForVariantKey(product: { variants: unknown }, variantKey: string): string | null {
  const tiers = parseVariantTiers(product.variants);
  const m = /^t(\d+)$/.exec(variantKey);
  if (!m) return null;
  const i = Number(m[1]);
  const label = tiers[i]?.label?.trim();
  return label || null;
}
