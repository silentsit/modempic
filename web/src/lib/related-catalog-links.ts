import type { RelatedLink } from "@/components/seo/related-links";

const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  modafinil: "/related/modafinil.png",
  peptides: "/related/peptides.png",
  "skin-care": "/related/skin-care.png",
  antiparasitic: "/related/antiparasitic.png",
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
    imageUrl: "/related/modafinil.png",
    imageAlt: "Modafinil cognitive support",
  },
  {
    href: "/shop/peptides",
    label: "Peptides",
    description: "Research peptides and peptide blends.",
    imageUrl: "/related/peptides.png",
    imageAlt: "Peptide research products",
  },
  {
    href: "/shop/skin-care",
    label: "Skin care",
    description: "Topical wellness products.",
    imageUrl: "/related/skin-care.png",
    imageAlt: "Skin care products",
  },
];
