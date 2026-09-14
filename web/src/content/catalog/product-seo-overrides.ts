/**
 * Code-level SEO overrides for product PDPs when DB seoTitle/seoDesc are thin or outdated.
 * Merged in generateMetadata; DB values win when present unless override is set here.
 */

export type ProductSeoOverride = {
  seoTitle?: string;
  seoDesc?: string;
};

export const PRODUCT_SEO_OVERRIDES: Record<string, ProductSeoOverride> = {
  "buy-artvigil-150-mg": {
    seoTitle: "Buy Artvigil 150 mg Online",
    seoDesc:
      "Buy Artvigil 150 mg Online — HAB 150 mg armodafinil at $50, $80, or $110, the lower 150 mg line here. Live USD checkout with card or crypto. Import rules vary.",
  },
  "buy-waklert-150-mg": {
    seoTitle: "Buy Waklert 150 mg Online",
    seoDesc:
      "Buy Waklert 150 mg Online — Sun Pharma 150 mg armodafinil at $59, $99, or $129. Pick a pack, see the live USD price, and check out when you are ready.",
  },
  "buy-lyrica-pregabalin-nervigesic-300-mg": {
    seoTitle: "Buy Pregabalin Online",
    seoDesc:
      "Buy Pregabalin Online as Nervigesic 300 mg. 30, 60, or 90 capsule packs at $105, $195, or $255. Card or crypto checkout. Import rules vary.",
  },
};

export function productSeoOverride(slug: string): ProductSeoOverride | undefined {
  return PRODUCT_SEO_OVERRIDES[slug];
}
