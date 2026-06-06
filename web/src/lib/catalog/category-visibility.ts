/** Storefront categories that must not appear in nav, sitemap, PLPs, or product listings. */
const HIDDEN_STOREFRONT_CATEGORY_SLUGS = new Set([
  "vitamins",
  "skin-care",
  "antiparasitic",
  "peptides",
]);

export function isStorefrontCategoryVisible(slug: string): boolean {
  return !HIDDEN_STOREFRONT_CATEGORY_SLUGS.has(slug);
}

export function productHasVisibleCategory(
  categories: ReadonlyArray<{ category: { slug: string } }>,
): boolean {
  return categories.length === 0 || categories.some((row) => isStorefrontCategoryVisible(row.category.slug));
}

export function filterVisibleCategorySlugs<T extends { slug: string }>(categories: T[]): T[] {
  return categories.filter((c) => isStorefrontCategoryVisible(c.slug));
}
