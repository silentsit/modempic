/** Slug for the peptides category — RUO/COA PDP modules render only for products in this category. */
export const PEPTIDES_CATEGORY_SLUG = "peptides";

/**
 * Flip to `true` when the peptides category and catalog are ready to go live.
 * While false: nav, sitemap, and /shop/peptides are hidden; RUO PDP modules stay off unless previewing.
 */
export const PEPTIDES_CATEGORY_LAUNCHED = false;
const ALWAYS_HIDDEN_CATEGORY_SLUGS = new Set(["vitamins", "cancer"]);

export function isPeptidesCategoryLaunched(): boolean {
  return PEPTIDES_CATEGORY_LAUNCHED;
}

export function isPeptidesCategorySlug(slug: string): boolean {
  return slug === PEPTIDES_CATEGORY_SLUG;
}

export function isPeptidesCategoryVisible(slug: string): boolean {
  if (ALWAYS_HIDDEN_CATEGORY_SLUGS.has(slug)) return false;
  return !isPeptidesCategorySlug(slug) || isPeptidesCategoryLaunched();
}

export function productInPeptidesCategory(
  categories: ReadonlyArray<{ category: { slug: string } }>,
): boolean {
  return categories.some((row) => row.category.slug === PEPTIDES_CATEGORY_SLUG);
}

export function productHasVisibleCategory(
  categories: ReadonlyArray<{ category: { slug: string } }>,
): boolean {
  return categories.length === 0 || categories.some((row) => isPeptidesCategoryVisible(row.category.slug));
}

export function filterVisibleCategorySlugs<T extends { slug: string }>(categories: T[]): T[] {
  return categories.filter((c) => isPeptidesCategoryVisible(c.slug));
}
