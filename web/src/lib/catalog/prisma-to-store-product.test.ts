import { describe, expect, it } from "vitest";
import { prismaToStoreProduct } from "./prisma-to-store-product";
import type { Product, ProductImage, ProductStatus } from "@prisma/client";

type CardInput = Product & {
  images: ProductImage[];
  categories: { category: { id: string; name: string; slug: string; description: string | null } }[];
  productVariants: {
    id: string;
    sku: string;
    label: string;
    priceCents: number;
    compareAtCents: number | null;
    sortOrder: number;
    active: boolean;
  }[];
};

function baseProduct(overrides: Partial<CardInput> = {}): CardInput {
  return {
    id: "prod_1",
    slug: "buy-armodaxl-150-mg",
    sku: "ARX-150",
    paymentCode: "MP-0001",
    name: "ArmodaXL 150 mg",
    shortDesc: "Sharp focus.",
    longDesc: "Long",
    bodyHtml: null,
    variants: [{ label: "30 tablets", priceCents: 4500, compareAtCents: 6000 }],
    priceCents: 4500,
    compareAtCents: 6000,
    status: "PUBLISHED" as ProductStatus,
    isBestSeller: true,
    disclaimer: null,
    purity: null,
    testingStatus: null,
    coaUrl: null,
    storageNotes: null,
    specifications: null,
    shippingRestrictions: null,
    seoTitle: null,
    seoDesc: null,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-06-01T00:00:00.000Z"),
    images: [
      {
        id: "img_1",
        productId: "prod_1",
        url: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
        alt: "ArmodaXL",
        sortOrder: 0,
      },
    ],
    categories: [
      {
        category: {
          id: "cat_1",
          name: "Nootropics",
          slug: "nootropics",
          description: null,
        },
      },
    ],
    productVariants: [
      {
        id: "var_30",
        sku: "ARX-150-30",
        label: "30 tablets",
        priceCents: 4500,
        compareAtCents: 6000,
        sortOrder: 0,
        active: true,
      },
      {
        id: "var_60",
        sku: "ARX-150-60",
        label: "60 tablets",
        priceCents: 8000,
        compareAtCents: null,
        sortOrder: 1,
        active: true,
      },
    ],
    ...overrides,
  };
}

describe("prismaToStoreProduct", () => {
  it("maps Prisma fields to Medusa-aligned Product", () => {
    const store = prismaToStoreProduct(baseProduct());
    expect(store.handle).toBe("buy-armodaxl-150-mg");
    expect(store.title).toBe("ArmodaXL 150 mg");
    expect(store.variants).toHaveLength(2);
    expect(store.variants[0]?.prices[0]?.amount).toBe(4500);
    expect(store.variants[0]?.prices[0]?.original_amount).toBe(6000);
    expect(store.categories[0]?.handle).toBe("nootropics");
    expect(store.metadata?.variantsJson).toEqual([
      { label: "30 tablets", priceCents: 4500, compareAtCents: 6000 },
      { label: "60 tablets", priceCents: 8000, compareAtCents: undefined },
    ]);
  });

  it("accepts serialized Date strings from the client boundary", () => {
    const product = baseProduct({
      createdAt: "2025-01-01T00:00:00.000Z" as unknown as Date,
      updatedAt: "2025-06-01T00:00:00.000Z" as unknown as Date,
    });
    const store = prismaToStoreProduct(product);
    expect(store.created_at).toBe("2025-01-01T00:00:00.000Z");
    expect(store.updated_at).toBe("2025-06-01T00:00:00.000Z");
  });

  it("falls back to JSON tiers when all productVariants are inactive", () => {
    const result = prismaToStoreProduct(
      baseProduct({
        productVariants: [
          {
            id: "var_dead",
            sku: "X",
            label: "Dead",
            priceCents: 100,
            compareAtCents: null,
            sortOrder: 0,
            active: false,
          },
        ],
      }),
    );
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]?.title).toBe("30 tablets");
    expect(result.variants[0]?.prices[0]?.amount).toBe(4500);
  });

  it("omits PDP HTML and unused metadata on listing cards", () => {
    const store = prismaToStoreProduct(
      baseProduct({
        bodyHtml: "<p>Huge imported description</p>",
        specifications: { cas: "123" },
      }),
      { listing: true },
    );
    expect(store.description_html).toBeNull();
    expect(store.metadata).toEqual({
      priceCents: 4500,
      compareAtCents: 6000,
      variantsJson: [
        { label: "30 tablets", priceCents: 4500, compareAtCents: 6000 },
        { label: "60 tablets", priceCents: 8000, compareAtCents: undefined },
      ],
    });
  });
});
