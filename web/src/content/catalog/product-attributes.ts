/**
 * Verified catalog attributes for comparison pages.
 * Manufacturer and active ingredient are set only when a public listing names them.
 * Strength is taken from the imported product name (the pack label).
 */

export type CatalogAttributeSource = {
  label: string;
  url: string;
};

export type VerifiedProductAttributes = {
  slug: string;
  strengthMg?: number;
  manufacturer?: string;
  activeIngredient?: "Modafinil" | "Armodafinil";
  sources: CatalogAttributeSource[];
};

export const PRODUCT_ATTRIBUTE_SOURCES = {
  modalert1mg: {
    label: "Tata 1mg — Modalert 200 Tablet (Sun Pharmaceutical Industries Ltd; Modafinil 200 mg)",
    url: "https://www.1mg.com/drugs/modalert-200-tablet-19043",
  },
  waklert1mg: {
    label: "Tata 1mg — Waklert 150 Tablet (Sun Pharmaceutical Industries Ltd; Armodafinil 150 mg)",
    url: "https://www.1mg.com/drugs/waklert-150-tablet-268967",
  },
  modafinilBrands1mg: {
    label: "Tata 1mg — Modafinil brand list (Vilafinil, Centurion Laboratories Private Limited)",
    url: "https://www.1mg.com/generics/modafinil-210297",
  },
  modaheal1mg: {
    label: "Tata 1mg — Modaheal 100mg Tablet (Healing Pharma India Pvt Ltd; Modafinil)",
    url: "https://www.1mg.com/drugs/modaheal-100mg-tablet-496561",
  },
  armodafinilWiki: {
    label: "Wikipedia — Armodafinil brand names (Artvigil, HAB Pharma; Waklert, Sun Pharma)",
    url: "https://en.wikipedia.org/wiki/Armodafinil",
  },
} as const;

export const VERIFIED_PRODUCT_ATTRIBUTES: VerifiedProductAttributes[] = [
  {
    slug: "buy-modaxl-300-mg",
    strengthMg: 300,
    sources: [],
  },
  {
    slug: "buy-modalert-200-mg",
    strengthMg: 200,
    manufacturer: "Sun Pharmaceutical Industries Ltd",
    activeIngredient: "Modafinil",
    sources: [PRODUCT_ATTRIBUTE_SOURCES.modalert1mg],
  },
  {
    slug: "buy-modasmart-400-mg",
    strengthMg: 400,
    sources: [],
  },
  {
    slug: "buy-modawake-200-mg",
    strengthMg: 200,
    sources: [],
  },
  {
    slug: "buy-artvigil-150-mg",
    strengthMg: 150,
    manufacturer: "HAB Pharmaceuticals",
    activeIngredient: "Armodafinil",
    sources: [PRODUCT_ATTRIBUTE_SOURCES.armodafinilWiki],
  },
  {
    slug: "buy-artvigil-250-mg",
    strengthMg: 250,
    manufacturer: "HAB Pharmaceuticals",
    activeIngredient: "Armodafinil",
    sources: [PRODUCT_ATTRIBUTE_SOURCES.armodafinilWiki],
  },
  {
    slug: "buy-vilafinil-200-mg",
    strengthMg: 200,
    manufacturer: "Centurion Laboratories Private Limited",
    activeIngredient: "Modafinil",
    sources: [PRODUCT_ATTRIBUTE_SOURCES.modafinilBrands1mg],
  },
  {
    slug: "buy-waklert-150-mg",
    strengthMg: 150,
    manufacturer: "Sun Pharmaceutical Industries Ltd",
    activeIngredient: "Armodafinil",
    sources: [PRODUCT_ATTRIBUTE_SOURCES.waklert1mg, PRODUCT_ATTRIBUTE_SOURCES.armodafinilWiki],
  },
  {
    slug: "buy-modavinil-200-mg",
    strengthMg: 200,
    sources: [],
  },
  {
    slug: "buy-modafil-md-200-mg",
    strengthMg: 200,
    sources: [],
  },
  {
    slug: "buy-modactive-200-mg",
    strengthMg: 200,
    sources: [],
  },
  {
    slug: "buy-armodaxl-250-mg",
    strengthMg: 250,
    sources: [],
  },
  {
    slug: "buy-armodaxl-150-mg",
    strengthMg: 150,
    sources: [],
  },
  {
    slug: "buy-modvigil-200-mg",
    strengthMg: 200,
    sources: [],
  },
  {
    slug: "buy-modaheal-200-mg",
    strengthMg: 200,
    manufacturer: "Healing Pharma India Pvt Ltd",
    activeIngredient: "Modafinil",
    sources: [PRODUCT_ATTRIBUTE_SOURCES.modaheal1mg],
  },
];

export function verifiedAttributesForSlug(slug: string): VerifiedProductAttributes | undefined {
  return VERIFIED_PRODUCT_ATTRIBUTES.find((row) => row.slug === slug);
}

export function parseStrengthMgFromName(name: string): number | null {
  const match = name.match(/(\d+(?:\.\d+)?)\s*mg\b/i);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}
