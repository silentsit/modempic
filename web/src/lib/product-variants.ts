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

/** Modafinil lines that show the red SALE badge on storefront cards. */
const STOREFRONT_SALE_BADGE_SLUG_PREFIXES = [
  "buy-modalert-",
  "buy-artvigil-",
  "buy-waklert-",
  "buy-vilafinil-",
  "buy-armodaxl-",
] as const;

export function productShowsStorefrontSaleBadge(product: {
  slug: string;
  priceCents: number;
  compareAtCents: number | null;
  variants: unknown;
}): boolean {
  if (!productHasSalePricing(product)) return false;
  return STOREFRONT_SALE_BADGE_SLUG_PREFIXES.some((prefix) => product.slug.startsWith(prefix));
}

export type StorefrontCornerBadge = "best-seller" | "sale";

/** Best seller wins over sale when both would apply. */
export function resolveStorefrontCornerBadge(
  product: {
    slug: string;
    priceCents: number;
    compareAtCents: number | null;
    variants: unknown;
  },
  mostPurchasedSlug: string | null | undefined,
): StorefrontCornerBadge | null {
  if (mostPurchasedSlug && product.slug === mostPurchasedSlug) return "best-seller";
  if (productShowsStorefrontSaleBadge(product)) return "sale";
  return null;
}

/**
 * Default pack for PDP / listing add-to-cart: the 100-count tier when present,
 * otherwise the last (largest) pack — used for combos that are not 30/50/100.
 */
export function defaultPackTierIndex(tiers: VariantTier[]): number {
  if (tiers.length === 0) return 0;
  const hundredIdx = tiers.findIndex((tier) => tierLabelLeadingQuantity(tierLabelBaseOnly(tier.label)) === 100);
  if (hundredIdx >= 0) return hundredIdx;
  return tiers.length - 1;
}

/** Plain `30 pills` / `50 pills` / `100 pills` only — not combo labels like `30 pills of each`. */
const SIMPLE_PILL_PACK_LABEL = /^\d+\s+pills?$/i;
const PER_PILL_SAVE_BASELINE_QTY = 30;
const PER_PILL_SAVE_TIER_QTY = new Set([50, 100]);

function simplePillPackQuantity(tier: VariantTier): number | null {
  const label = tierLabelBaseOnly(tier.label);
  if (!SIMPLE_PILL_PACK_LABEL.test(label)) return null;
  return tierLabelLeadingQuantity(label);
}

/**
 * Percent cheaper per pill vs the 30-pack, for 50- and 100-count rows only.
 * Null when there is no 30-pack, the row is not 50/100, or the pack is not actually cheaper.
 */
export function packTierPerPillSavePercent(tiers: VariantTier[], tierIndex: number): number | null {
  const current = tiers[tierIndex];
  if (!current) return null;
  const qty = simplePillPackQuantity(current);
  if (qty == null || !PER_PILL_SAVE_TIER_QTY.has(qty)) return null;
  const baseline = tiers.find((tier) => simplePillPackQuantity(tier) === PER_PILL_SAVE_BASELINE_QTY);
  if (!baseline || baseline.priceCents <= 0) return null;
  const baselineEach = baseline.priceCents / PER_PILL_SAVE_BASELINE_QTY;
  const thisEach = current.priceCents / qty;
  if (!(thisEach < baselineEach)) return null;
  const pct = Math.round((1 - thisEach / baselineEach) * 100);
  return pct >= 1 ? pct : null;
}

export function lowestPriceFromTiers(tiers: VariantTier[]): { priceCents: number; compareAtCents?: number } | null {
  if (tiers.length === 0) return null;
  const sorted = [...tiers].sort((a, b) => a.priceCents - b.priceCents);
  const first = sorted[0];
  return { priceCents: first.priceCents, compareAtCents: first.compareAtCents };
}

/** Lowest per-pill price across pack tiers. Null when no pill quantity can be parsed. */
export function lowestPricePerPillCents(tiers: VariantTier[]): number | null {
  let lowest: number | null = null;
  for (const tier of tiers) {
    const label = tierLabelBaseOnly(tier.label);
    if (!/\bpills?\b/i.test(label)) continue;
    const qty = tierLabelLeadingQuantity(label);
    if (qty == null || qty <= 0) continue;
    const unitCents = Math.round(tier.priceCents / qty);
    if (lowest == null || unitCents < lowest) lowest = unitCents;
  }
  return lowest;
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
