import { truncateProductHint } from "./anonymize";

export type PublishedProductRef = {
  slug: string;
  name: string;
};

/** Whether a product hint or slug refers to a published catalog item. */
export function publishedProductMatches(
  products: ReadonlyArray<PublishedProductRef>,
  options: { productSlug?: string; productHint?: string },
): boolean {
  const slug = options.productSlug?.trim();
  if (slug) {
    return products.some((p) => p.slug === slug);
  }
  const hint = options.productHint?.trim();
  if (!hint) return true;
  const normalizedHint = hint.toLowerCase();
  return products.some((p) => {
    const name = p.name.trim();
    if (!name) return false;
    const normalizedName = name.toLowerCase();
    const truncated = truncateProductHint(name).toLowerCase();
    return normalizedName === normalizedHint || truncated === normalizedHint;
  });
}
