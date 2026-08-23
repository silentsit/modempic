import { STOREFRONT_CATEGORIES } from "@/lib/catalog/storefront-categories";
import type { NavItem } from "@/types";

/**
 * Header dropdown + footer Shop column. Keep in sync with STOREFRONT_CATEGORIES.
 */
export const shopCategoryNav: (NavItem & { slug: string })[] = STOREFRONT_CATEGORIES.map((category) => ({
  href: `/shop/${category.slug}`,
  label: category.name,
  slug: category.slug,
}));
