/**
 * Code-level SEO overrides for product PDPs when DB seoDesc is thin or outdated.
 * Document title and H1 always use the product name so they match.
 */

export type ProductSeoOverride = {
  seoTitle?: string;
  seoDesc?: string;
};

export const PRODUCT_SEO_OVERRIDES: Record<string, ProductSeoOverride> = {
  "buy-artvigil-150-mg": {
    seoTitle: "Artvigil 150 mg",
    seoDesc:
      "Artvigil 150 mg is HAB 150 mg armodafinil at $50, $80, or $110, the lower 150 mg line here. Live USD checkout with card or crypto. Import rules vary.",
  },
  "buy-waklert-150-mg": {
    seoTitle: "Waklert 150 mg",
    seoDesc:
      "Waklert 150 mg is Sun Pharma 150 mg armodafinil at $59, $99, or $129. Pick a pack, see the live USD price, and check out when you are ready.",
  },
  "buy-lyrica-pregabalin-nervigesic-300-mg": {
    seoTitle: "Lyrica (Pregabalin Nervigesic) 300 mg",
    seoDesc:
      "Lyrica (Pregabalin Nervigesic) 300 mg is listed as Nervigesic capsules in 30, 60, or 90 packs at $105, $195, or $255. Card or crypto checkout. Import rules vary.",
  },
};

export function productSeoOverride(slug: string): ProductSeoOverride | undefined {
  return PRODUCT_SEO_OVERRIDES[slug];
}
