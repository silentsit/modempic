import type { RelatedLink } from "@/components/seo/related-links";

const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  nootropics: "/related/modafinil.svg",
  modafinil: "/related/modafinil.svg",
};

export const BLOG_RELATED_PLACEHOLDER_IMAGE = "/related/blog-article.svg";

/** Image for a shop category slug, if we have a curated thumbnail. */
export function catalogCategoryImageUrl(slug: string): string | undefined {
  return CATEGORY_IMAGE_BY_SLUG[slug];
}

/** Static category thumbnails for “Shop our catalog” blocks (under `/public/related/`). */
export const SHOP_CATALOG_RELATED_LINKS: RelatedLink[] = [
  {
    href: "/shop/nootropics",
    label: "Nootropics",
    description: "Catalog records, labels, and ordering details.",
    imageUrl: "/related/modafinil.svg",
    imageAlt: "Nootropics catalog items",
  },
  {
    href: "/shop/anti-epileptic",
    label: "Anti-Epileptic",
    description: "Catalog records, labels, and ordering details.",
  },
  {
    href: "/shop/skincare",
    label: "Skincare",
    description: "Catalog records, labels, and ordering details.",
  },
  {
    href: "/shop/sexual-health",
    label: "Sexual Health",
    description: "Catalog records, labels, and ordering details.",
  },
];
