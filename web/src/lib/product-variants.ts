import { formatUsd } from "@/lib/domain/money";

export type VariantTier = {
  label: string;
  priceCents: number;
  compareAtCents?: number;
};

export function parseVariantTiers(raw: unknown): VariantTier[] {
  if (!Array.isArray(raw)) return [];
  const out: VariantTier[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const label = typeof r.label === "string" ? r.label : "";
    const priceCents = typeof r.priceCents === "number" && Number.isFinite(r.priceCents) ? r.priceCents : null;
    if (!label || priceCents === null) continue;
    const compareAtCents =
      typeof r.compareAtCents === "number" && Number.isFinite(r.compareAtCents) ? r.compareAtCents : undefined;
    out.push({ label, priceCents, compareAtCents });
  }
  return out;
}

/** PDP / cards: single price or tier min–max range. Prefer tier JSON when exactly one tier so price stays in sync with checkout. */
export function formatProductPriceDisplay(product: {
  priceCents: number;
  compareAtCents: number | null;
  variants: unknown;
}): string {
  const tiers = parseVariantTiers(product.variants);
  if (tiers.length > 1) {
    const lows = tiers.map((t) => t.priceCents);
    const min = Math.min(...lows);
    const max = Math.max(...lows);
    return min === max ? formatUsd(min) : `${formatUsd(min)} – ${formatUsd(max)}`;
  }
  if (tiers.length === 1) {
    return formatUsd(tiers[0].priceCents);
  }
  return formatUsd(product.priceCents);
}

/**
 * Compare-at for strikethrough next to a single headline price (ignored when multi-tier range is shown).
 */
export function productHeadlineCompareStrikeCents(product: {
  priceCents: number;
  compareAtCents: number | null;
  variants: unknown;
}): number | null {
  const tiers = parseVariantTiers(product.variants);
  if (tiers.length > 1) return null;
  if (tiers.length === 1) {
    const t = tiers[0];
    const basis = t.priceCents;
    if (t.compareAtCents != null && t.compareAtCents > basis) return t.compareAtCents;
    if (product.compareAtCents != null && product.compareAtCents > basis) return product.compareAtCents;
    return null;
  }
  if (product.compareAtCents != null && product.compareAtCents > product.priceCents) return product.compareAtCents;
  return null;
}

/** Sale badge: tier-level compare-at or single-price compare-at. */
export function productHasSalePricing(product: {
  priceCents: number;
  compareAtCents: number | null;
  variants: unknown;
}): boolean {
  const tiers = parseVariantTiers(product.variants);
  if (tiers.some((t) => t.compareAtCents != null && t.compareAtCents > t.priceCents)) return true;
  return tiers.length <= 1 && product.compareAtCents != null && product.compareAtCents > product.priceCents;
}

export function lowestPriceFromTiers(tiers: VariantTier[]): { priceCents: number; compareAtCents?: number } | null {
  if (tiers.length === 0) return null;
  const sorted = [...tiers].sort((a, b) => a.priceCents - b.priceCents);
  const first = sorted[0];
  return { priceCents: first.priceCents, compareAtCents: first.compareAtCents };
}

/** Pack total on tier lines: whole dollars without ".00", otherwise two decimals (e.g. $45, $35.50). */
export function formatUsdTierLine(cents: number): string {
  if (!Number.isFinite(cents)) return "$0";
  if (cents % 100 === 0) return `$${cents / 100}`;
  return `$${(cents / 100).toFixed(2)}`;
}

/** Per-unit segment in parentheses — always two decimals, e.g. `30 pills — $45 — ($1.50 each)`. */
export function formatUsdEachFromCents(unitCents: number): string {
  if (!Number.isFinite(unitCents)) return "$0.00";
  return `$${(unitCents / 100).toFixed(2)}`;
}

/**
 * Leading integer at start of label (e.g. "30 pills" → 30) for per-unit price.
 * Returns null if there is no match (e.g. "Standard").
 */
export function tierLabelLeadingQuantity(label: string): number | null {
  const m = label.trim().match(/^(\d+)/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const EM = "\u2014";

/**
 * Import/Woo data sometimes stores a full price line in `label`. Dropdown/cart should only use the
 * pack description and derive `$total` / `each` from `priceCents`.
 */
export function tierLabelBaseOnly(raw: string): string {
  let t = raw.trim();
  for (;;) {
    const chopEm = t.search(/\s[\u2014\u2013]\s*\$/);
    const chopHy = t.search(/\s-\s*\$/);
    const chop = chopEm === -1 ? chopHy : chopHy === -1 ? chopEm : Math.min(chopEm, chopHy);
    if (chop === -1) break;
    const next = t.slice(0, chop).trim();
    if (next === t) break;
    t = next;
  }
  return t;
}

/**
 * One display line for tier dropdowns: `label — $total — ($X.XX each)` (em-dashes `—`).
 * Per-unit uses the leading count when present (e.g. `60 pills` → ÷60); otherwise treats as qty 1.
 */
export function formatTierPriceLine(tier: VariantTier): string {
  const label = tierLabelBaseOnly(tier.label);
  const total = formatUsdTierLine(tier.priceCents);
  const parsedQty = tierLabelLeadingQuantity(label);
  const qty = parsedQty != null && parsedQty > 0 ? parsedQty : 1;
  const unitCents = Math.round(tier.priceCents / qty);
  const each = formatUsdEachFromCents(unitCents);
  return `${label} ${EM} ${total} ${EM} (${each} each)`;
}
