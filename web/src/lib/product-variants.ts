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
 * One display line, e.g. `30 pills — $45 — ($1.50 each)` (spaces + em-dashes `—`).
 */
export function formatTierPriceLine(tier: VariantTier): string {
  const label = tier.label.trim();
  const total = formatUsdTierLine(tier.priceCents);
  const qty = tierLabelLeadingQuantity(label);
  if (qty != null && qty > 0) {
    const unitCents = Math.round(tier.priceCents / qty);
    const each = formatUsdEachFromCents(unitCents);
    return `${label} ${EM} ${total} ${EM} (${each} each)`;
  }
  return `${label} ${EM} ${total}`;
}
