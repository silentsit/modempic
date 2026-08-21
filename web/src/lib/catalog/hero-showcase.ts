/** Preferred hero cluster: Artvigil, Vilafinil, Modalert — matches the price-comparison SKUs. */
export const HERO_SHOWCASE_SLUGS = [
  "buy-artvigil-150-mg",
  "buy-vilafinil-200-mg",
  "buy-modalert-200-mg",
] as const;

/** Isolated blister-pack cutouts for the homepage hero cluster. */
export const HERO_CUTOUTS = [
  {
    slug: "buy-artvigil-150-mg",
    name: "Artvigil 150 mg",
    imageUrl: "/hero/artvigil-150.png",
  },
  {
    slug: "buy-vilafinil-200-mg",
    name: "Vilafinil 200 mg",
    imageUrl: "/hero/vilafinil-200.png",
  },
  {
    slug: "buy-modalert-200-mg",
    name: "Modalert 200 mg",
    imageUrl: "/hero/modalert-200.png",
  },
] as const;

type ShowcaseCandidate = {
  slug: string;
  images: { url: string | null }[];
};

/**
 * Pick up to three products with images, preferring `preferredSlugs` order,
 * then filling from the remaining catalog.
 */
export function pickHeroShowcaseProducts<T extends ShowcaseCandidate>(
  products: T[],
  preferredSlugs: readonly string[] = HERO_SHOWCASE_SLUGS,
): T[] {
  const withImage = products.filter((p) => p.images.some((img) => Boolean(img.url)));
  const bySlug = new Map(withImage.map((p) => [p.slug, p]));
  const picked: T[] = [];
  const seen = new Set<string>();

  for (const slug of preferredSlugs) {
    const product = bySlug.get(slug);
    if (product) {
      picked.push(product);
      seen.add(product.slug);
    }
  }

  for (const product of withImage) {
    if (picked.length >= 3) break;
    if (seen.has(product.slug)) continue;
    picked.push(product);
    seen.add(product.slug);
  }

  return picked.slice(0, 3);
}
