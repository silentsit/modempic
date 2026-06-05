import type { Prisma, ProductVariant } from "@prisma/client";
import { parseVariantTiers, type VariantTier } from "@/lib/product-variants";

/** Minimal variant fields for tier resolution (Prisma rows or admin form snapshots). */
export type VariantTierSource = {
  id?: string;
  label: string;
  variantKey: string;
  sortOrder: number;
  active: boolean;
  priceCents: number;
  compareAtCents?: number | null;
};

export type VariantSyncInput = {
  productId: string;
  productSlug: string;
  productName: string;
  priceCents: number;
  compareAtCents: number | null;
  tiers: VariantTier[];
};

export function variantKeyForTierIndex(tierCount: number, index: number): string {
  if (tierCount <= 1) return "";
  return `t${index}`;
}

export function skuForVariant(productSlug: string, variantKey: string): string {
  if (!variantKey) return productSlug;
  return `${productSlug}-${variantKey}`;
}

export function tiersFromProduct(product: {
  priceCents?: number;
  compareAtCents?: number | null;
  variants: unknown;
  productVariants?: VariantTierSource[];
  name?: string;
}): VariantTier[] {
  const activeVariants = (product.productVariants ?? [])
    .filter((v) => v.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (activeVariants.length > 0) {
    return activeVariants.map((v) => ({
      label: v.label,
      priceCents: v.priceCents,
      compareAtCents: v.compareAtCents ?? undefined,
    }));
  }
  const fromJson = parseVariantTiers(product.variants);
  if (fromJson.length > 0) return fromJson;
  return [];
}

export async function syncProductVariants(
  tx: Prisma.TransactionClient,
  input: VariantSyncInput,
): Promise<ProductVariant[]> {
  const tiers =
    input.tiers.length > 0
      ? input.tiers
      : [
          {
            label: input.productName,
            priceCents: input.priceCents,
            compareAtCents: input.compareAtCents ?? undefined,
          },
        ];

  const desired = tiers.map((tier, i) => {
    const variantKey = variantKeyForTierIndex(tiers.length, i);
    return {
      variantKey,
      sku: skuForVariant(input.productSlug, variantKey),
      label: tier.label,
      priceCents: tier.priceCents,
      compareAtCents: tier.compareAtCents ?? null,
      sortOrder: i,
    };
  });

  const desiredKeys = desired.map((d) => d.variantKey);
  await tx.productVariant.updateMany({
    where: { productId: input.productId, variantKey: { notIn: desiredKeys } },
    data: { active: false },
  });

  const rows: ProductVariant[] = [];
  for (const d of desired) {
    const row = await tx.productVariant.upsert({
      where: {
        productId_variantKey: { productId: input.productId, variantKey: d.variantKey },
      },
      create: {
        productId: input.productId,
        variantKey: d.variantKey,
        sku: d.sku,
        label: d.label,
        priceCents: d.priceCents,
        compareAtCents: d.compareAtCents,
        sortOrder: d.sortOrder,
        active: true,
      },
      update: {
        sku: d.sku,
        label: d.label,
        priceCents: d.priceCents,
        compareAtCents: d.compareAtCents,
        sortOrder: d.sortOrder,
        active: true,
      },
    });
    rows.push(row);
  }

  const baseSku = desired.length === 1 ? desired[0].sku : null;
  await tx.product.update({
    where: { id: input.productId },
    data: { sku: baseSku },
  });

  return rows;
}

export async function backfillProductVariantsForProduct(
  tx: Prisma.TransactionClient,
  product: {
    id: string;
    slug: string;
    name: string;
    priceCents: number;
    compareAtCents: number | null;
    variants: unknown;
  },
): Promise<ProductVariant[]> {
  const tiers = parseVariantTiers(product.variants);
  return syncProductVariants(tx, {
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    priceCents: product.priceCents,
    compareAtCents: product.compareAtCents,
    tiers:
      tiers.length > 0
        ? tiers
        : [{ label: product.name, priceCents: product.priceCents, compareAtCents: product.compareAtCents ?? undefined }],
  });
}

export function findVariantByKey(
  variants: VariantTierSource[],
  variantKey: string,
): VariantTierSource | null {
  return variants.find((v) => v.active && v.variantKey === variantKey) ?? null;
}
