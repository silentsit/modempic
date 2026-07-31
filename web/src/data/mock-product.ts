import type { Cart, Category, Product } from "@/types";

/**
 * ============================================================================
 * MOCK MEDUSA DATA — handoff contract for backend integration.
 *
 * Shapes satisfy types.ts exactly (Medusa-aligned). Cursor replaces these
 * exports with Store API calls:
 *   GET /store/products?handle=<handle>&expand=variants,options,images,categories
 * and maps the response 1:1 onto the Product interface (field names already
 * match Medusa's snake_case convention).
 *
 * Content note: copy below is preserved verbatim from the live storefront
 * (ArmodaXL 150 mg card). Do not edit copy here — it's a content fixture.
 * ============================================================================
 */

const modafinilCategory: Category = {
  id: "pcat_modafinil",
  name: "Modafinil",
  handle: "modafinil",
  description: "Modafinil and armodafinil-line wellness products.",
  parent_category_id: null,
  category_children: [],
  image: null,
  metadata: null,
};

export const mockProduct: Product = {
  id: "prod_armodaxl_150",
  handle: "armodaxl-150-mg",
  title: "ArmodaXL 150 mg",
  subtitle: null,
  description:
    "Boost your productivity and stay sharp all day with ArmodaXL 150 mg! Buy ArmodaXL 150 mg now and seize this chance to excel before it’s gone!",
  description_html: null, // legacy WooCommerce body; populated on migration if present
  thumbnail: "/images/products/armodaxl-150.png",
  images: [
    {
      id: "img_armodaxl_150_1",
      url: "/images/products/armodaxl-150.png",
      alt: "ArmodaXL 150 mg",
    },
  ],
  options: [
    {
      id: "opt_pack_size",
      title: "Pack Size",
      product_id: "prod_armodaxl_150",
      values: [
        { id: "optval_30", value: "30 tablets", option_id: "opt_pack_size" },
        { id: "optval_60", value: "60 tablets", option_id: "opt_pack_size" },
        { id: "optval_100", value: "100 tablets", option_id: "opt_pack_size" },
      ],
    },
  ],
  variants: [
    {
      id: "variant_armodaxl_150_30",
      product_id: "prod_armodaxl_150",
      title: "30 tablets",
      sku: "ARX-150-30",
      options: { opt_pack_size: "optval_30" },
      prices: [
        {
          id: "price_armodaxl_150_30",
          currency_code: "usd",
          amount: 3500,
          original_amount: 4900,
        },
      ],
      inventory_quantity: 120,
      manage_inventory: true,
      allow_backorder: false,
    },
    {
      id: "variant_armodaxl_150_60",
      product_id: "prod_armodaxl_150",
      title: "60 tablets",
      sku: "ARX-150-60",
      options: { opt_pack_size: "optval_60" },
      prices: [
        {
          id: "price_armodaxl_150_60",
          currency_code: "usd",
          amount: 6200,
          original_amount: 8900,
        },
      ],
      inventory_quantity: 86,
      manage_inventory: true,
      allow_backorder: false,
    },
    {
      id: "variant_armodaxl_150_100",
      product_id: "prod_armodaxl_150",
      title: "100 tablets",
      sku: "ARX-150-100",
      options: { opt_pack_size: "optval_100" },
      prices: [
        {
          id: "price_armodaxl_150_100",
          currency_code: "usd",
          amount: 9500,
          original_amount: 13900,
        },
      ],
      inventory_quantity: 54,
      manage_inventory: true,
      allow_backorder: false,
    },
  ],
  categories: [modafinilCategory],
  tags: ["armodafinil", "best-seller"],
  status: "published",
  is_featured: true,
  metadata: {
    // PDP documentation fields (purity, testing_status, coa_url, storage_notes,
    // shipping_restrictions, specifications) belong here in Medusa — Cursor
    // maps them out of metadata into the PDP documentation section.
  },
  created_at: "2025-01-15T09:00:00.000Z",
  updated_at: "2025-06-01T12:00:00.000Z",
};

/** Mock cart summary — feeds SiteHeader badge + Cart page scaffold. */
export const mockCart: Cart = {
  id: "cart_mock",
  items: [
    {
      id: "item_mock_1",
      cart_id: "cart_mock",
      variant_id: "variant_armodaxl_150_60",
      product: {
        id: mockProduct.id,
        handle: mockProduct.handle,
        title: mockProduct.title,
        thumbnail: mockProduct.thumbnail,
      },
      variant: { id: "variant_armodaxl_150_60", title: "60 tablets", sku: "ARX-150-60" },
      quantity: 1,
      unit_price: 6200,
      total: 6200,
    },
  ],
  item_count: 1,
  subtotal: 6200,
  currency_code: "usd",
};

/* ----------------------------------------------------------------------------
 * ADAPTER STUB — Cursor implements this against the Medusa Store API.
 *
 * The PDP currently renders a Prisma-era view model (name/slug/tiers/reviews/
 * specifications...). This adapter is the single seam between Medusa's Product
 * and that view model:
 *
 *   - title        -> name
 *   - handle       -> slug
 *   - variants[]   -> tiers[] (VariantTier: label, priceCents, compareAtCents)
 *   - description  -> shortDesc
 *   - description_html -> bodyHtml (sanitized via sanitizeProductBodyHtml)
 *   - metadata.*   -> purity / testingStatus / coaUrl / storageNotes /
 *                     shippingRestrictions / specifications
 *
 * Reviews stay app-local (Medusa has no native reviews) — keep the existing
 * reviews data source or swap for a review provider later.
 * ------------------------------------------------------------------------- */
// export function toProductViewModel(product: Product): ProductViewModel { ... }
