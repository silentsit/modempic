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
