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
    seoTitle: "Buy Artvigil Online — Artvigil 150 mg for Sale",
    seoDesc:
      "Buy Artvigil online at Modempic: 150 mg armodafinil packs from $50, free tracked shipping worldwide, live USD prices. Pay with card or crypto.",
  },
  "buy-waklert-150-mg": {
    seoTitle: "Buy Waklert Online — Waklert 150 mg for Sale",
    seoDesc:
      "Buy Waklert online at Modempic: 150 mg armodafinil packs, free worldwide shipping, and live USD pack pricing. Card or crypto checkout.",
  },
};

export function productSeoOverride(slug: string): ProductSeoOverride | undefined {
  return PRODUCT_SEO_OVERRIDES[slug];
}
