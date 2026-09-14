import { comparePath } from "./compare-keys";

/** Highest-volume brand pairs that stay as live compare pages. */
export const PUBLIC_COMPARE_PAIRS = [
  ["buy-modalert-200-mg", "buy-waklert-150-mg"],
  ["buy-artvigil-150-mg", "buy-modalert-200-mg"],
  ["buy-modalert-200-mg", "buy-vilafinil-200-mg"],
  ["buy-artvigil-150-mg", "buy-waklert-150-mg"],
] as const;

export const PUBLIC_COMPARE_PATHS = PUBLIC_COMPARE_PAIRS.map(([left, right]) => comparePath(left, right));

/**
 * Compare URLs that were published in the XML sitemap and then retired.
 * 301 these onto the price hub so they do not 404.
 */
export const RETIRED_COMPARE_PATHS = [
  "/compare/artvigil-250-mg-vs-modalert-200-mg",
  "/compare/modaheal-200-mg-vs-modalert-200-mg",
  "/compare/artvigil-250-mg-vs-waklert-150-mg",
  "/compare/vilafinil-200-mg-vs-waklert-150-mg",
  "/compare/artvigil-150-mg-vs-artvigil-250-mg",
  "/compare/artvigil-150-mg-vs-vilafinil-200-mg",
  "/compare/modaheal-200-mg-vs-waklert-150-mg",
  "/compare/artvigil-150-mg-vs-modaheal-200-mg",
  "/compare/artvigil-250-mg-vs-vilafinil-200-mg",
  "/compare/modaheal-200-mg-vs-vilafinil-200-mg",
] as const;

export function isPublicComparePath(path: string) {
  return (PUBLIC_COMPARE_PATHS as readonly string[]).includes(path);
}

export function selectPublicComparePairs<T extends { path: string }>(pairs: T[]): T[] {
  return pairs.filter((pair) => isPublicComparePath(pair.path));
}
