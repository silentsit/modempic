import { ProductStatus } from "@prisma/client";
import { tiersForCompare } from "@/lib/compare/cost-per-dose";

export const COMPARE_MIN_TIERS = 2;
export const COMPARE_MIN_COMBINED_REVIEWS = 3;

export type CompareGateProduct = {
  slug: string;
  name: string;
  status: ProductStatus | string;
  manufacturer: string | null;
  activeIngredient?: string | null;
  strengthMg?: number | null;
  variants: unknown;
  productVariants?: Array<{
    label: string;
    priceCents: number;
    compareAtCents: number | null;
    sortOrder: number;
    active: boolean;
  }>;
  approvedReviewCount: number;
  isBestSeller?: boolean;
};

export type CompareGateResult = {
  ok: boolean;
  reasons: string[];
};

const COMBO_SLUG = /combo/i;

export function isCompareCandidate(product: CompareGateProduct): CompareGateResult {
  const reasons: string[] = [];
  if (product.status !== ProductStatus.PUBLISHED && product.status !== "PUBLISHED") {
    reasons.push("not-published");
  }
  if (COMBO_SLUG.test(product.slug) || COMBO_SLUG.test(product.name)) {
    reasons.push("combo");
  }
  if (!product.manufacturer?.trim()) {
    reasons.push("missing-manufacturer");
  }
  const tiers = tiersForCompare(product);
  if (tiers.length < COMPARE_MIN_TIERS) {
    reasons.push("insufficient-tiers");
  }
  return { ok: reasons.length === 0, reasons };
}

export function isIndexableComparePair(
  left: CompareGateProduct,
  right: CompareGateProduct,
): CompareGateResult {
  const leftGate = isCompareCandidate(left);
  const rightGate = isCompareCandidate(right);
  const reasons = [
    ...leftGate.reasons.map((reason) => `left:${reason}`),
    ...rightGate.reasons.map((reason) => `right:${reason}`),
  ];
  if (left.slug === right.slug) reasons.push("same-product");
  const reviews = left.approvedReviewCount + right.approvedReviewCount;
  if (reviews < COMPARE_MIN_COMBINED_REVIEWS) {
    reasons.push("insufficient-reviews");
  }
  return { ok: reasons.length === 0, reasons };
}
