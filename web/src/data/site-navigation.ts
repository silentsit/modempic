import { STOREFRONT_CATEGORIES } from "@/lib/catalog/storefront-categories";
import type { NavItem } from "@/types";

/**
 * Header links after Shop (desktop + mobile). Shop itself is rendered separately
 * so it can stay a /shop link with a category dropdown.
 */
export const primaryNav: NavItem[] = [
  { href: "/how-to-pay", label: "How to Pay" },
  { href: "/about", label: "About" },
  { href: "/shipping", label: "Shipping" },
  { href: "/contact", label: "Contact" },
];

/**
 * Header Shop dropdown + footer Shop column. Keep in sync with STOREFRONT_CATEGORIES.
 */
export const shopCategoryNav: (NavItem & { slug: string })[] = STOREFRONT_CATEGORIES.map((category) => ({
  href: `/shop/${category.slug}`,
  label: category.name,
  slug: category.slug,
}));
