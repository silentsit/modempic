"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatUsd } from "@/lib/domain/money";
import { formatUsdEachFromCents } from "@/lib/product-variants";

export type PriceComparisonRow = {
  slug: string;
  name: string;
  href: string;
  manufacturer: string | null;
  activeIngredient: string | null;
  strengthMg: number | null;
  packPrices: Array<{ label: string; priceCents: number | null }>;
  costPerTabletCents: number | null;
  costPer200mgCents: number | null;
  reviewCount: number;
};

type SortKey = "name" | "strength" | "per200" | "perTablet" | "reviews";

export function PriceComparisonTable({
  rows,
  packLabels,
}: {
  rows: PriceComparisonRow[];
  packLabels: string[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("per200");
  const [asc, setAsc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const dir = asc ? 1 : -1;
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      if (sortKey === "strength") return ((a.strengthMg ?? 0) - (b.strengthMg ?? 0)) * dir;
      if (sortKey === "reviews") return (a.reviewCount - b.reviewCount) * dir;
      if (sortKey === "perTablet") return ((a.costPerTabletCents ?? Number.POSITIVE_INFINITY) - (b.costPerTabletCents ?? Number.POSITIVE_INFINITY)) * dir;
      return ((a.costPer200mgCents ?? Number.POSITIVE_INFINITY) - (b.costPer200mgCents ?? Number.POSITIVE_INFINITY)) * dir;
    });
    return copy;
  }, [asc, rows, sortKey]);

  function toggle(next: SortKey) {
    if (sortKey === next) {
      setAsc((value) => !value);
      return;
    }
    setSortKey(next);
    setAsc(true);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">
              <button type="button" className="hover:text-foreground" onClick={() => toggle("name")}>
                Product
              </button>
            </th>
            <th className="px-4 py-3 font-semibold">
              <button type="button" className="hover:text-foreground" onClick={() => toggle("strength")}>
                Strength
              </button>
            </th>
            {packLabels.map((label) => (
              <th key={label} className="px-4 py-3 font-semibold">
                {label}
              </th>
            ))}
            <th className="px-4 py-3 font-semibold">
              <button type="button" className="hover:text-foreground" onClick={() => toggle("perTablet")}>
                Per tablet
              </button>
            </th>
            <th className="px-4 py-3 font-semibold">
              <button type="button" className="hover:text-foreground" onClick={() => toggle("per200")}>
                Per 200 mg
              </button>
            </th>
            <th className="px-4 py-3 font-semibold">
              <button type="button" className="hover:text-foreground" onClick={() => toggle("reviews")}>
                Reviews
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.slug} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <Link href={row.href} className="font-medium text-foreground hover:text-primary">
                  {row.name}
                </Link>
                {row.manufacturer ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{row.manufacturer}</p>
                ) : null}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {row.strengthMg != null ? `${row.strengthMg} mg` : "—"}
                {row.activeIngredient ? (
                  <p className="text-xs text-muted-foreground">{row.activeIngredient}</p>
                ) : null}
              </td>
              {row.packPrices.map((pack) => (
                <td key={pack.label} className="px-4 py-3 tabular-nums">
                  {pack.priceCents != null ? formatUsd(pack.priceCents) : "—"}
                </td>
              ))}
              <td className="px-4 py-3 tabular-nums">
                {row.costPerTabletCents != null ? formatUsdEachFromCents(row.costPerTabletCents) : "—"}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {row.costPer200mgCents != null ? formatUsdEachFromCents(row.costPer200mgCents) : "—"}
              </td>
              <td className="px-4 py-3 tabular-nums">{row.reviewCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
