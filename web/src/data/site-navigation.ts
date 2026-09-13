import { STOREFRONT_CATEGORIES } from "@/lib/catalog/storefront-categories";
import { comparePath } from "@/lib/compare/compare-keys";
import { SHIPPING_COUNTRIES } from "@/content/shipping/country-pages";
import type { FooterSection, NavItem } from "@/types";

/**
 * Header Shop dropdown + footer Shop column. Keep in sync with STOREFRONT_CATEGORIES.
 */
export const shopCategoryNav: (NavItem & { slug: string })[] = STOREFRONT_CATEGORIES.map((category) => ({
  href: `/shop/${category.slug}`,
  label: category.name,
  slug: category.slug,
}));

export const shopMenuExtraNav: NavItem[] = [
  { href: "/modafinil-price-comparison", label: "Price comparison" },
  { href: "/shop/best-sellers", label: "Best sellers" },
];

export const shopNavItem: NavItem = {
  href: "/shop",
  label: "Shop",
  children: [...shopCategoryNav, ...shopMenuExtraNav],
};

export function shippingCountryNavLabel(countryName: string) {
  return countryName.replace(/^the /i, "");
}

export const shippingDestinationNav: NavItem[] = SHIPPING_COUNTRIES.map((country) => ({
  href: `/shipping/${country.slug}`,
  label: shippingCountryNavLabel(country.countryName),
}));

export const shippingWorldwideNav: NavItem = {
  href: "/shipping",
  label: "We ship worldwide",
};

/** Header/footer Shipping list: worldwide first, then destination notes (not a closed ship-to roster). */
export const shippingMenuNav: NavItem[] = [
  shippingWorldwideNav,
  ...shippingDestinationNav.map((item, index) =>
    index === 0 ? { ...item, groupLabel: "Destination notes" } : item,
  ),
];

/** Highest-volume brand pairs that already pass the comparison quality gate. */
export const COMPARE_NAV_PAIRS = [
  ["buy-modalert-200-mg", "buy-waklert-150-mg"],
  ["buy-artvigil-150-mg", "buy-modalert-200-mg"],
  ["buy-modalert-200-mg", "buy-vilafinil-200-mg"],
  ["buy-artvigil-150-mg", "buy-waklert-150-mg"],
] as const;

export function shortCompareNavLabel(leftSlug: string, rightSlug: string) {
  const brand = (slug: string) => {
    const key = slug.replace(/^buy-/i, "");
    const brandToken = key.split("-")[0] ?? key;
    return brandToken.charAt(0).toUpperCase() + brandToken.slice(1);
  };
  return `${brand(leftSlug)} vs ${brand(rightSlug)}`;
}

export const compareNav: NavItem[] = [
  { href: "/modafinil-price-comparison", label: "Price comparison" },
  ...COMPARE_NAV_PAIRS.map(([left, right]) => ({
    href: comparePath(left, right),
    label: shortCompareNavLabel(left, right),
  })),
];

/**
 * Header links after Shop. Items with `children` render as a dropdown / accordion.
 */
export const primaryNav: NavItem[] = [
  { href: "/how-to-pay", label: "How to Pay" },
  { href: "/about", label: "About" },
  {
    href: "/shipping",
    label: "Shipping",
    children: shippingMenuNav,
  },
  { href: "/contact", label: "Contact" },
];

export const headerNav: NavItem[] = [shopNavItem, ...primaryNav];

/** Mobile accordion rows toggle; keep the parent landing page as the first child. */
export function mobileNavChildren(item: NavItem): NavItem[] {
  const children = item.children ?? [];
  if (children.length === 0) return [];
  if (item.href === "/shop") {
    return [{ href: "/shop", label: "All products" }, ...children];
  }
  return children;
}

export const footerSections: FooterSection[] = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All products" },
      ...shopCategoryNav,
      { href: "/shop/best-sellers", label: "Best sellers" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/modempic-reviews", label: "Reviews" },
      { href: "/modafinil-price-comparison", label: "Price comparison" },
      shippingWorldwideNav,
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/refund-policy", label: "Refunds" },
      { href: "/how-to-pay", label: "How to pay" },
      { href: "/contact", label: "Contact" },
    ],
  },
];
