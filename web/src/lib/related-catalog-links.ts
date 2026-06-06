import type { RelatedLink } from "@/components/seo/related-links";
import { isPeptidesCategoryVisible } from "@/lib/catalog/peptide-category";

const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  modafinil: "/related/modafinil.svg",
  peptides: "/related/peptides.svg",
  "skin-care": "/related/skin-care.svg",
  antiparasitic: "/related/antiparasitic.svg",
  cancer: "/related/cancer.svg",
};

export const BLOG_RELATED_PLACEHOLDER_IMAGE = "/related/blog-article.svg";

/** Image for a shop category slug, if we have a curated thumbnail. */
export function catalogCategoryImageUrl(slug: string): string | undefined {
  return CATEGORY_IMAGE_BY_SLUG[slug];
}

const ALL_SHOP_CATALOG_RELATED_LINKS: (RelatedLink & { categorySlug: string })[] = [
  {
    href: "/shop/modafinil",
    label: "Modafinil",
    description: "Catalog records, labels, and ordering details.",
    imageUrl: "/related/modafinil.svg",
    imageAlt: "Modafinil catalog items",
    categorySlug: "modafinil",
  },
  {
    href: "/shop/peptides",
    label: "Peptides",
    description: "Research peptides and peptide blends.",
    imageUrl: "/related/peptides.svg",
    imageAlt: "Peptide research products",
    categorySlug: "peptides",
  },
  {
    href: "/shop/skin-care",
    label: "Skin care",
    description: "Label details, pricing, and product records.",
    imageUrl: "/related/skin-care.svg",
    imageAlt: "Skin care products",
    categorySlug: "skin-care",
  },
];

/** Static category thumbnails for “Shop our catalog” blocks (under `/public/related/`). */
export const SHOP_CATALOG_RELATED_LINKS: RelatedLink[] = ALL_SHOP_CATALOG_RELATED_LINKS.filter((link) =>
  isPeptidesCategoryVisible(link.categorySlug),
).map((link) => ({
  href: link.href,
  label: link.label,
  description: link.description,
  imageUrl: link.imageUrl,
  imageAlt: link.imageAlt,
}));
