import type { RelatedLink } from "@/components/seo/related-links";

const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  modafinil: "/related/modafinil.svg",
  vitamins: "/related/vitamins.svg",
  "skin-care": "/related/skin-care.svg",
  "best-sellers": "/related/best-sellers.svg",
};

export const BLOG_RELATED_PLACEHOLDER_IMAGE = "/related/blog-article.svg";

/** Image for a shop category slug, if we have a curated thumbnail. */
export function catalogCategoryImageUrl(slug: string): string | undefined {
  return CATEGORY_IMAGE_BY_SLUG[slug];
}

/** Static category thumbnails for “Shop our catalog” blocks (under `/public/related/`). */
export const SHOP_CATALOG_RELATED_LINKS: RelatedLink[] = [
  {
    href: "/shop/modafinil",
    label: "Modafinil",
    description: "Cognitive support and wakefulness.",
    imageUrl: "/related/modafinil.svg",
    imageAlt: "Modafinil tablets",
  },
  {
    href: "/shop/vitamins",
    label: "Vitamins",
    description: "Daily nutritional support.",
    imageUrl: "/related/vitamins.svg",
    imageAlt: "Vitamin supplements",
  },
  {
    href: "/shop/skin-care",
    label: "Skin care",
    description: "Topical wellness products.",
    imageUrl: "/related/skin-care.svg",
    imageAlt: "Skin care products",
  },
];
