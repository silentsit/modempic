/**
 * ============================================================================
 * MODEMPIC — types.ts
 * Single source of truth for all data contracts.
 *
 * Naming convention:
 *  - Commerce types mirror Medusa.js response shapes (snake_case fields).
 *  - CMS types mirror Sanity document shapes (_id, _type, _key conventions).
 *  - UI types are app-local and framework-agnostic.
 *
 * Integration note for Cursor:
 *  - Replace /data/*.ts mocks with Medusa Store API + Sanity GROQ fetches.
 *  - Components must never import from /data directly — props only.
 * ============================================================================
 */

/* ========================================================================== */
/* COMMERCE — Medusa-aligned                                                   */
/* ========================================================================== */

/** Medusa: MoneyAmount / Price */
export interface Price {
  id: string;
  currency_code: string; // e.g. "usd"
  /** Amount in the currency's smallest unit (cents). Medusa convention. */
  amount: number;
  /** Present on calculated prices when a sale/discount applies */
  original_amount?: number | null;
}

/** Medusa: ProductOptionValue */
export interface ProductOptionValue {
  id: string;
  value: string; // e.g. "30 tablets"
  option_id: string;
}

/** Medusa: ProductOption (e.g. "Pack Size") */
export interface ProductOption {
  id: string;
  title: string;
  product_id: string;
  values: ProductOptionValue[];
}

/** Medusa: ProductVariant */
export interface ProductVariant {
  id: string;
  product_id: string;
  title: string; // e.g. "30 tablets"
  sku: string | null;
  /** option_id -> option_value_id map, per Medusa */
  options: Record<string, string>;
  prices: Price[];
  inventory_quantity: number;
  manage_inventory: boolean;
  allow_backorder: boolean;
}

/** Medusa: ProductImage */
export interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
}

/** Medusa: ProductCategory */
export interface Category {
  id: string;
  name: string;
  handle: string; // slug, e.g. "modafinil"
  description: string | null;
  parent_category_id: string | null;
  category_children: Category[];
  /** CMS-managed presentation fields (Sanity or metadata) */
  image?: ProductImage | null;
  metadata?: Record<string, unknown> | null;
}

/** Medusa: Product */
export interface Product {
  id: string;
  handle: string; // slug, e.g. "armodaxl-150-mg"
  title: string; // e.g. "ArmodaXL 150 mg"
  subtitle: string | null;
  /** Short card description (current: marketing blurb) */
  description: string | null;
  /**
   * Long-form PDP body. Current site renders imported WooCommerce HTML
   * via `.product-body-html`; target state is Sanity Portable Text.
   * Keep both during migration — UI prefers `body` when present.
   */
  description_html: string | null; // legacy, renders with .product-body-html
  thumbnail: string | null;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  categories: Category[];
  tags: string[];
  status: "draft" | "published" | "archived";
  is_featured?: boolean; // drives "Best selling products" rails
  metadata?: Record<string, unknown> | null;
  created_at: string; // ISO 8601
  updated_at: string;
}

/** Medusa: LineItem */
export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  /** Denormalized for render; source of truth is variant_id lookup */
  product: Pick<Product, "id" | "handle" | "title" | "thumbnail">;
  variant: Pick<ProductVariant, "id" | "title" | "sku">;
  quantity: number;
  unit_price: number; // smallest currency unit
  total: number; // unit_price * quantity
}

/** Medusa: Cart (summary shape for header badge + drawer) */
export interface Cart {
  id: string;
  items: CartItem[];
  item_count: number; // feeds the header badge (replaces /api/cart/count)
  subtotal: number;
  currency_code: string;
}

/* ========================================================================== */
/* CMS — Sanity-aligned                                                        */
/* ========================================================================== */

/** Sanity: Portable Text span (child of a block) */
export interface PortableTextSpan {
  _type: "span";
  _key: string;
  text: string;
  marks?: string[];
}

/** Sanity: mark definition (links, annotations) */
export interface PortableTextMarkDef {
  _type: string; // e.g. "link"
  _key: string;
  href?: string;
  [key: string]: unknown;
}

/** Sanity: Portable Text block */
export interface PortableTextBlock {
  _type: "block" | "image" | string;
  _key: string;
  style?: "normal" | "h2" | "h3" | "h4" | "blockquote";
  children?: PortableTextSpan[];
  markDefs?: PortableTextMarkDef[];
  listItem?: "bullet" | "number";
  level?: number;
  /** present when _type === "image" */
  asset?: { _ref: string; url?: string };
  alt?: string;
}

/** Sanity: image with hotspot/crop */
export interface SanityImage {
  _type: "image";
  asset: { _ref: string; url?: string };
  alt?: string;
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

/** Sanity: slug object */
export interface Slug {
  _type: "slug";
  current: string;
}

/** Sanity: author document (bylines for E-E-A-T) */
export interface Author {
  _id: string;
  _type: "author";
  name: string;
  slug: Slug;
  role?: string; // e.g. "Registered Dietitian" — reuse for testimonial titles
  image?: SanityImage;
  bio?: PortableTextBlock[];
  credentials?: string[]; // E-E-A-T trust surface
}

/** Sanity: SEO fields (reusable across documents) */
export interface SeoFields {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: SanityImage;
  noIndex?: boolean;
}

/** Sanity: article/post document (Blog) */
export interface Article {
  _id: string;
  _type: "article";
  title: string;
  slug: Slug;
  excerpt?: string;
  mainImage?: SanityImage;
  body: PortableTextBlock[];
  author: Author;
  categories?: { _id: string; title: string; slug: Slug }[];
  publishedAt: string; // ISO 8601
  updatedAt?: string;
  seo?: SeoFields;
}

/**
 * Sanity: trust signal document.
 * Backs the badge strip (McAfee, Norton, BBB, Trustpilot) and any
 * quality/lab assurances. Managed in CMS so marketing can rotate them.
 */
export interface TrustSignal {
  _id: string;
  _type: "trustSignal";
  name: string; // e.g. "Trustpilot"
  logo: SanityImage;
  href?: string;
  alt: string;
  order: number; // explicit sort — never rely on array order
  isActive: boolean;
}

/* ========================================================================== */
/* CMS — Sanity custom block: product embed                                    */
/* ========================================================================== */

/**
 * Sanity custom object inserted inline in Portable Text.
 * Studio editors pick a product; the renderer resolves it to a full Product
 * (via `reference` -> Medusa lookup at render time) and drops a ProductCard
 * mid-article.
 */
export interface ProductEmbedBlock {
  _type: "productEmbed";
  _key: string;
  /** Sanity reference -> resolved server-side before reaching the renderer */
  product: Product;
  /** Optional editor-controlled layout */
  layout?: "inline" | "wide";
}

/* ========================================================================== */
/* UI / LAYOUT — app-local                                                     */
/* ========================================================================== */

/** Navigation link; children render as dropdown (desktop) / accordion (mobile) */
export interface NavItem {
  label: string;
  href: string;
  /** e.g. Shop -> categories, plus "All products" appended at render */
  children?: NavItem[];
  external?: boolean;
}

/** Header session user — mirrors current header.tsx props */
export interface SiteUser {
  name?: string | null;
  email?: string | null;
  role?: "ADMIN" | "STAFF" | "CUSTOMER" | null;
}

/** Announcement bar message (current: free-shipping promo) */
export interface Announcement {
  id: string;
  message: string; // "100% FREE Shipping"
  cta?: { label: string; href: string }; // "Shop now"
  isActive: boolean;
}

/** Hero content block — CMS-managed eventually, static for now */
export interface HeroContent {
  kicker: string; // "medicine made affordable"
  headlineLines: string[]; // ["Medicine shouldn't", "be a privilege."]
  subcopy: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

/** Testimonial card (current: 3 quotes w/ avatar, name, role) */
export interface Testimonial {
  id: string;
  quote: string;
  name: string; // "Marcus T."
  role: string; // "Urban Planner"
  avatar?: SanityImage | null;
  rating?: 1 | 2 | 3 | 4 | 5; // reserved; not displayed currently
}

/** Footer link column (current: Shop / Company / Help / Resources) */
export interface FooterSection {
  title: string;
  links: NavItem[];
}

/** Footer legal bar (Privacy / Terms) */
export interface FooterLegal {
  copyright: string; // rendered with current year
  links: NavItem[];
}

/** Social link (current: Instagram, env-driven URL) */
export interface SocialLink {
  platform: "instagram" | "x" | "facebook" | "linkedin" | "tiktok";
  href: string;
  ariaLabel: string;
}

/** Compliance disclaimer (current footer block — must be preserved verbatim) */
export interface Disclaimer {
  id: string;
  text: string;
  placement: "footer" | "pdp" | "checkout";
}

/** Section header pattern used site-wide (kicker / heading / subcopy / link) */
export interface SectionHeading {
  kicker?: string; // "POPULAR PICKS"
  title: string; // "Best selling products"
  description?: string;
  align?: "left" | "center";
  link?: { label: string; href: string }; // "View all products ->"
}
