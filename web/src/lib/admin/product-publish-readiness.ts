import { ProductStatus } from "@prisma/client";

export type PublishReadinessInput = {
  status: ProductStatus | string;
  seoTitle?: string;
  seoDesc?: string;
  disclaimer?: string;
  coaUrl?: string;
  categorySlugs: string[];
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  galleryUrls?: string;
  galleryAlts?: string;
  productType?: "simple" | "variable";
  tierCount?: number;
};

export type PublishChecklistItem = {
  id: string;
  label: string;
  ok: boolean;
  required: boolean;
};

export function productPublishChecklist(input: PublishReadinessInput): PublishChecklistItem[] {
  const publishing = input.status === ProductStatus.PUBLISHED;
  const required = publishing;

  const galleryLines = (input.galleryUrls ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const galleryAltLines = (input.galleryAlts ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim());

  const hasFeatured = Boolean(input.featuredImageUrl?.trim());
  const featuredAltOk = Boolean(input.featuredImageAlt?.trim());
  const galleryAltsOk = galleryLines.every((_, i) => Boolean(galleryAltLines[i]?.trim()));

  const requiresPeptideDisclaimer = input.categorySlugs.includes("peptides");
  const disclaimerOk =
    !requiresPeptideDisclaimer ||
    (Boolean(input.disclaimer?.trim()) &&
      /(research|not\s+for\s+human|laboratory)/i.test(input.disclaimer ?? ""));

  const coaOk = !input.coaUrl?.trim() || /^https:\/\//i.test(input.coaUrl.trim());
  const tiersOk =
    input.productType !== "variable" || (input.tierCount ?? 0) >= 2;

  return [
    { id: "category", label: "At least one category selected", ok: input.categorySlugs.length > 0, required },
    { id: "image", label: "Featured product image (HTTPS URL)", ok: hasFeatured, required },
    { id: "alt", label: "Alt text for featured and gallery images", ok: featuredAltOk && galleryAltsOk, required },
    { id: "seoTitle", label: "SEO title", ok: Boolean(input.seoTitle?.trim()), required },
    { id: "seoDesc", label: "Meta description", ok: Boolean(input.seoDesc?.trim()), required },
    {
      id: "disclaimer",
      label: requiresPeptideDisclaimer ? "Research-use disclaimer (peptides only)" : "Disclaimer (not required)",
      ok: disclaimerOk,
      required: required && requiresPeptideDisclaimer,
    },
    { id: "coa", label: "COA URL uses HTTPS when set", ok: coaOk, required: false },
    { id: "tiers", label: "Variable products have at least two pack tiers", ok: tiersOk, required },
  ];
}

export function validateProductPublishReadiness(input: PublishReadinessInput): string | null {
  if (input.status !== ProductStatus.PUBLISHED) return null;

  const failing = productPublishChecklist(input).filter((item) => item.required && !item.ok);
  if (failing.length === 0) return null;
  return `To publish this product, ${failing.map((f) => f.label.toLowerCase()).join(", ")}.`;
}
