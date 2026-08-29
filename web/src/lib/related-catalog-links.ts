import type { RelatedLink } from "@/components/seo/related-links";

const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  nootropics: "/related/nootropics.webp",
  modafinil: "/related/nootropics.webp",
  "anti-epileptic": "/related/anti-epileptic.webp",
  skincare: "/related/skincare.webp",
  "sexual-health": "/related/sexual-health.webp",
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
    imageUrl: "/related/nootropics.webp",
    imageAlt: "Amber glass, ginkgo leaves, and coffee beans on teal silk",
  },
  {
    href: "/shop/anti-epileptic",
    label: "Anti-Epileptic",
    description: "Catalog records, labels, and ordering details.",
    imageUrl: "/related/anti-epileptic.webp",
    imageAlt: "Amethyst, gold rings, and rippled water on pale marble",
  },
  {
    href: "/shop/skincare",
    label: "Skincare",
    description: "Catalog records, labels, and ordering details.",
    imageUrl: "/related/skincare.webp",
    imageAlt: "Serum dropper, rose, citrus, and a jade roller on wet stone",
  },
  {
    href: "/shop/sexual-health",
    label: "Sexual Health",
    description: "Catalog records, labels, and ordering details.",
    imageUrl: "/related/sexual-health.webp",
    imageAlt: "Pomegranate, orchid, and pearls on blush silk",
  },
];
