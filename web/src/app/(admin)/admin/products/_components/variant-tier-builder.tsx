"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VariantTier } from "@/lib/product-variants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Row = { label: string; price: string; compare: string };

function tiersToRows(tiers: VariantTier[]): Row[] {
  if (tiers.length === 0) {
    return [
      { label: "", price: "", compare: "" },
      { label: "", price: "", compare: "" },
    ];
  }
  return tiers.map((t) => ({
    label: t.label,
    price: (t.priceCents / 100).toFixed(2),
    compare: t.compareAtCents != null && t.compareAtCents > 0 ? (t.compareAtCents / 100).toFixed(2) : "",
  }));
}

function rowsToJson(rows: Row[]): string {
  const tiers = rows
    .map((r) => {
      const label = r.label.trim();
      const priceCents = Math.round(Number.parseFloat(r.price) * 100);
      if (!label || !Number.isFinite(priceCents) || priceCents < 0) return null;
      const compareRaw = r.compare.trim();
      const compareAtCents = compareRaw
        ? Math.round(Number.parseFloat(compareRaw) * 100)
        : undefined;
      const out: { label: string; priceCents: number; compareAtCents?: number } = { label, priceCents };
      if (compareAtCents != null && Number.isFinite(compareAtCents) && compareAtCents > priceCents) {
        out.compareAtCents = compareAtCents;
      }
      return out;
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
  return JSON.stringify(tiers);
}

export function VariantTierBuilder({
  initialTiers,
  onTierCountChange,
}: {
  initialTiers: VariantTier[];
  onTierCountChange?: (count: number) => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => tiersToRows(initialTiers));

  const json = useMemo(() => rowsToJson(rows), [rows]);
  const tierCount = useMemo(() => {
    try {
      const parsed = JSON.parse(json) as unknown;
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }, [json]);

  useEffect(() => {
    onTierCountChange?.(tierCount);
  }, [tierCount, onTierCountChange]);

  const updateRow = useCallback((i: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { label: "", price: "", compare: "" }]);
  }, []);

  const removeRow = useCallback((i: number) => {
    setRows((prev) => (prev.length <= 2 ? prev : prev.filter((_, j) => j !== i)));
  }, []);

  return (
    <div className="space-y-3">
      <input type="hidden" name="variantsJson" value={json} />
      <p className="text-xs text-[#50575e]">
        Each row is one pack / tier (e.g. “30 pills”). Prices are in USD. Add at least two rows for variable pricing.
      </p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid gap-2 rounded-md border border-[#dcdcde] bg-[#f6f7f7] p-3 sm:grid-cols-[1fr_100px_100px_auto]"
          >
            <div>
              <Label className="text-xs text-[#50575e]">Label</Label>
              <Input
                value={row.label}
                onChange={(e) => updateRow(i, { label: e.target.value })}
                placeholder="e.g. 30 pills"
                className="mt-0.5 h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-[#50575e]">Price ($)</Label>
              <Input
                value={row.price}
                onChange={(e) => updateRow(i, { price: e.target.value })}
                inputMode="decimal"
                placeholder="45"
                className="mt-0.5 h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-[#50575e]">Compare ($)</Label>
              <Input
                value={row.compare}
                onChange={(e) => updateRow(i, { compare: e.target.value })}
                inputMode="decimal"
                placeholder="optional"
                className="mt-0.5 h-9"
              />
            </div>
            <div className="flex items-end justify-end">
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => removeRow(i)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={addRow}>
        Add tier
      </Button>
    </div>
  );
}
