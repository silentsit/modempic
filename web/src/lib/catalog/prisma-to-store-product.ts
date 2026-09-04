import type { Product as PrismaProduct, ProductImage as PrismaProductImage } from "@prisma/client";
import { productImageDeliveryUrl } from "@/lib/cloudinary-delivery-url";
import { filterVisibleCategorySlugs } from "@/lib/catalog/category-visibility";
import { storefrontShortDesc } from "@/lib/product-short-desc";
import { parseVariantTiers, type VariantTier } from "@/lib/product-variants";
import type { Category, Product, ProductVariant } from "@/types";

type PrismaCardProduct = Omit<PrismaProduct, "createdAt" | "updatedAt"> & {
  createdAt: Date | string;
  updatedAt: Date | string;
  images: PrismaProductImage[];
  categories?: { category: { id?: string; name?: string; slug: string; description?: string | null } }[];
  productVariants?: {
    id: string;
    sku: string;
    label: string;
    priceCents: number;
    compareAtCents: number | null;
    sortOrder: number;
    active: boolean;
  }[];
};

function toIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function tiersFromStoreVariants(variants: ProductVariant[]): VariantTier[] {
  return variants.map((v) => {
    const price = v.prices[0];
    const amount = price?.amount ?? 0;
    const original = price?.original_amount;
    return {
      label: v.title,
      priceCents: amount,
      compareAtCents:
        original != null && original > amount ? original : undefined,
    };
  });
}

/**
 * Maps a Prisma catalog product (+ images/categories) into the Medusa-aligned
 * storefront `Product` contract used by redesign ProductCard and future Store API.
 *
 * Safe across the RSC → client boundary (serialized Date strings).
 */
export function prismaToStoreProduct(
  product: PrismaCardProduct,
  options?: { listing?: boolean },
): Product {
  const jsonTiers = parseVariantTiers(product.variants);
  const optionId = `opt_pack_${product.id}`;

  let variants: ProductVariant[] = [];

  if (product.productVariants && product.productVariants.length > 0) {
    const active = [...product.productVariants]
      .filter((v) => v.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    variants = active.map((v) => ({
      id: v.id,
      product_id: product.id,
      title: v.label,
      sku: v.sku,
      options: { [optionId]: v.id },
      prices: [
        {
          id: `price_${v.id}`,
          currency_code: "usd",
          amount: v.priceCents,
          original_amount:
            v.compareAtCents != null && v.compareAtCents > v.priceCents ? v.compareAtCents : null,
        },
      ],
      inventory_quantity: 0,
      manage_inventory: false,
      allow_backorder: true,
    }));
  }

  if (variants.length === 0 && jsonTiers.length > 0) {
    variants = jsonTiers.map((tier, index) => {
      const id = `tier_${product.id}_${index}`;
      return {
        id,
        product_id: product.id,
        title: tier.label,
        sku: product.sku ?? null,
        options: { [optionId]: id },
        prices: [
          {
            id: `price_${id}`,
            currency_code: "usd",
            amount: tier.priceCents,
            original_amount:
              tier.compareAtCents != null && tier.compareAtCents > tier.priceCents
                ? tier.compareAtCents
                : null,
          },
        ],
        inventory_quantity: 0,
        manage_inventory: false,
        allow_backorder: true,
      };
    });
  }

  if (variants.length === 0) {
    const id = `default_${product.id}`;
    variants = [
      {
        id,
        product_id: product.id,
        title: "Default",
        sku: product.sku ?? null,
        options: {},
        prices: [
          {
            id: `price_${id}`,
            currency_code: "usd",
            amount: product.priceCents,
            original_amount:
              product.compareAtCents != null && product.compareAtCents > product.priceCents
                ? product.compareAtCents
                : null,
          },
        ],
        inventory_quantity: 0,
        manage_inventory: false,
        allow_backorder: true,
      },
    ];
  }

  const images = [...product.images]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, options?.listing ? 1 : undefined)
    .map((img) => ({
      id: img.id,
      url: productImageDeliveryUrl(img.url, "card"),
      alt: img.alt || product.name,
    }));

  const visibleCategories = product.categories
    ? filterVisibleCategorySlugs(product.categories.map((row) => row.category))
    : [];

  const categories: Category[] = visibleCategories.map((c) => ({
    id: c.id ?? c.slug,
    name: c.name ?? c.slug,
    handle: c.slug,
    description: c.description ?? null,
    parent_category_id: null,
    category_children: [],
    image: null,
    metadata: null,
  }));

  const status = product.status === "PUBLISHED" ? "published" : "draft";
  const displayTiers = tiersFromStoreVariants(variants);

  return {
    id: product.id,
    handle: product.slug,
    title: product.name,
    subtitle: null,
    description: storefrontShortDesc(product.shortDesc),
    description_html: options?.listing ? null : product.bodyHtml,
    thumbnail: images[0]?.url ?? null,
    images,
    options:
      variants.length > 1
        ? [
            {
              id: optionId,
              title: "Pack Size",
              product_id: product.id,
              values: variants.map((v) => ({
                id: v.id,
                value: v.title,
                option_id: optionId,
              })),
            },
          ]
        : [],
    variants,
    categories,
    tags: [],
    status,
    is_featured: product.isBestSeller,
    metadata: options?.listing
      ? {
          priceCents: product.priceCents,
          compareAtCents: product.compareAtCents,
          variantsJson: displayTiers,
        }
      : {
          purity: product.purity,
          testingStatus: product.testingStatus,
          coaUrl: product.coaUrl,
          storageNotes: product.storageNotes,
          shippingRestrictions: product.shippingRestrictions,
          specifications: product.specifications,
          // Same tiers used for display — keeps sale badge / strike in sync
          priceCents: product.priceCents,
          compareAtCents: product.compareAtCents,
          variantsJson: displayTiers,
        },
    created_at: toIso(product.createdAt),
    updated_at: toIso(product.updatedAt),
  };
}
