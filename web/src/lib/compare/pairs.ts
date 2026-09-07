import { canonicalComparePair, comparePath, slugFromCompareKey } from "@/lib/compare/compare-keys";
import { isIndexableComparePair, type CompareGateProduct } from "@/lib/compare/quality-gate";

/** Brands that may form a cross-molecule pair (modafinil × armodafinil). */
export const COMPARE_CORE_SLUGS = [
  "buy-modalert-200-mg",
  "buy-modvigil-200-mg",
  "buy-vilafinil-200-mg",
  "buy-artvigil-150-mg",
  "buy-waklert-150-mg",
] as const;

export const COMPARE_BATCH_ONE_LIMIT = 15;

export type ComparePair = {
  leftSlug: string;
  rightSlug: string;
  param: string;
  path: string;
  batch: 1 | 2;
};

function moleculeOf(product: CompareGateProduct): string | null {
  return product.activeIngredient?.trim() || null;
}

function allowsCrossMolecule(left: CompareGateProduct, right: CompareGateProduct): boolean {
  const core = new Set<string>(COMPARE_CORE_SLUGS);
  return core.has(left.slug) || core.has(right.slug);
}

export function shouldPairProducts(left: CompareGateProduct, right: CompareGateProduct): boolean {
  if (!isIndexableComparePair(left, right).ok) return false;
  const leftMolecule = moleculeOf(left);
  const rightMolecule = moleculeOf(right);
  if (leftMolecule && rightMolecule && leftMolecule === rightMolecule) return true;
  if (leftMolecule && rightMolecule && leftMolecule !== rightMolecule) {
    return allowsCrossMolecule(left, right);
  }
  return false;
}

export function popularityScore(product: CompareGateProduct & { isBestSeller?: boolean }): number {
  return (product.isBestSeller ? 10_000 : 0) + product.approvedReviewCount * 100;
}

export function buildComparePairs(
  products: Array<CompareGateProduct & { isBestSeller?: boolean }>,
): ComparePair[] {
  const eligible = products.filter((product) => product.manufacturer?.trim());
  const raw: Array<ComparePair & { score: number }> = [];
  const seen = new Set<string>();

  for (let i = 0; i < eligible.length; i += 1) {
    for (let j = i + 1; j < eligible.length; j += 1) {
      const left = eligible[i];
      const right = eligible[j];
      if (!shouldPairProducts(left, right)) continue;
      const canonical = canonicalComparePair(left.slug, right.slug);
      if (seen.has(canonical.param)) continue;
      seen.add(canonical.param);
      raw.push({
        leftSlug: slugFromCompareKey(canonical.left),
        rightSlug: slugFromCompareKey(canonical.right),
        param: canonical.param,
        path: comparePath(left.slug, right.slug),
        batch: 2,
        score: popularityScore(left) + popularityScore(right),
      });
    }
  }

  raw.sort((a, b) => b.score - a.score || a.param.localeCompare(b.param));
  return raw.map((pair, index) => ({
    leftSlug: pair.leftSlug,
    rightSlug: pair.rightSlug,
    param: pair.param,
    path: pair.path,
    batch: index < COMPARE_BATCH_ONE_LIMIT ? 1 : 2,
  }));
}
