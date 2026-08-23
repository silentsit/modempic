export type StorefrontCategoryDef = {
  slug: string;
  name: string;
  /** Legacy Category slugs whose products belong here until fully remapped. */
  sourceSlugs: readonly string[];
};

export const STOREFRONT_CATEGORIES: readonly StorefrontCategoryDef[] = [
  { slug: "nootropics", name: "Nootropics", sourceSlugs: ["modafinil"] },
  { slug: "anti-epileptic", name: "Anti-Epileptic", sourceSlugs: ["gabapentin", "pregabalin"] },
  { slug: "skincare", name: "Skincare", sourceSlugs: ["tretinoin", "skin-care"] },
  { slug: "sexual-health", name: "Sexual Health", sourceSlugs: ["sildenafil"] },
];

export const STOREFRONT_CATEGORY_SLUGS = new Set(STOREFRONT_CATEGORIES.map((category) => category.slug));

/** Old product-name category URLs → the storefront category that replaced them. */
export const LEGACY_CATEGORY_REDIRECTS: Record<string, string> = {
  modafinil: "nootropics",
  gabapentin: "anti-epileptic",
  pregabalin: "anti-epileptic",
  tretinoin: "skincare",
  "skin-care": "skincare",
  sildenafil: "sexual-health",
};

export function isStorefrontCategorySlug(slug: string): boolean {
  return STOREFRONT_CATEGORY_SLUGS.has(slug);
}

export function isLegacyMappedCategorySlug(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(LEGACY_CATEGORY_REDIRECTS, slug);
}

export function storefrontCategoryBySlug(slug: string): StorefrontCategoryDef | undefined {
  return STOREFRONT_CATEGORIES.find((category) => category.slug === slug);
}

export function sortStorefrontCategories<T extends { slug: string }>(categories: T[]): T[] {
  const order = new Map(STOREFRONT_CATEGORIES.map((category, index) => [category.slug, index]));
  return [...categories].sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999));
}

export function productCategorySlugsForQuery(storefrontSlug: string): string[] {
  const def = storefrontCategoryBySlug(storefrontSlug);
  if (!def) return [storefrontSlug];
  return [def.slug, ...def.sourceSlugs];
}

export function mappedStorefrontSlug(slug: string): string | undefined {
  return LEGACY_CATEGORY_REDIRECTS[slug];
}
