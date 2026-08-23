import { isLegacyMappedCategorySlug, isStorefrontCategorySlug } from "./storefront-categories";

/** Only the four merchandising categories appear in nav, sitemap, PLPs, and product listings. */
export function isStorefrontCategoryVisible(slug: string): boolean {
  return isStorefrontCategorySlug(slug);
}

export function productHasVisibleCategory(
  categories: ReadonlyArray<{ category: { slug: string } }>,
): boolean {
  return (
    categories.length === 0 ||
    categories.some(
      (row) => isStorefrontCategoryVisible(row.category.slug) || isLegacyMappedCategorySlug(row.category.slug),
    )
  );
}

export function filterVisibleCategorySlugs<T extends { slug: string }>(categories: T[]): T[] {
  return categories.filter((c) => isStorefrontCategoryVisible(c.slug));
}
