import type { NavItem } from "@/types";

/**
 * TODO(cursor): replace with Sanity "siteNavigation" singleton, or swap for
 * Medusa product categories directly. Shape already matches NavItem[].
 * Single source of truth for header dropdown + footer "Shop" column so the
 * two never drift out of sync.
 */
export const shopCategoryNav: (NavItem & { slug: string })[] = [
  { href: "/shop/modafinil", label: "Modafinil", slug: "modafinil" },
  { href: "/shop/tretinoin", label: "Tretinoin", slug: "tretinoin" },
  { href: "/shop/sildenafil", label: "Sildenafil", slug: "sildenafil" },
  { href: "/shop/gabapentin", label: "Gabapentin", slug: "gabapentin" },
  { href: "/shop/pregabalin", label: "Pregabalin", slug: "pregabalin" },
];
