import { titleCaseHeading } from "@/lib/text/heading-title-case";

const BUY_PREFIX = /^buy-/i;

export function compareKeyFromSlug(slug: string): string {
  return slug.replace(BUY_PREFIX, "").toLowerCase();
}

export function slugFromCompareKey(key: string): string {
  if (key.startsWith("buy-")) return key;
  return `buy-${key}`;
}

export function parseComparePairParam(raw: string): { left: string; right: string } | null {
  const match = raw.trim().toLowerCase().match(/^([a-z0-9-]+)-vs-([a-z0-9-]+)$/);
  if (!match) return null;
  const left = match[1];
  const right = match[2];
  if (!left || !right || left === right) return null;
  return { left, right };
}

export function canonicalComparePair(a: string, b: string): { left: string; right: string; param: string } {
  const keys = [compareKeyFromSlug(a), compareKeyFromSlug(b)].sort((x, y) => x.localeCompare(y));
  return { left: keys[0], right: keys[1], param: `${keys[0]}-vs-${keys[1]}` };
}

export function comparePath(a: string, b: string): string {
  return `/compare/${canonicalComparePair(a, b).param}`;
}

export function isCanonicalCompareParam(param: string): boolean {
  const parsed = parseComparePairParam(param);
  if (!parsed) return false;
  return canonicalComparePair(parsed.left, parsed.right).param === param;
}

export function comparePairDisplayLabel(param: string): string {
  const words = param.replace(/-vs-/g, " vs ").replace(/-/g, " ");
  return titleCaseHeading(words);
}
