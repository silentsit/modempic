import Link from "next/link";
import { formatUsd } from "@/lib/domain/money";
import type { PriceIndexEdition } from "@/lib/compare/price-index";

export function PriceIndexTable({ edition }: { edition: PriceIndexEdition }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">
          {edition.quarter} Modempic Modafinil pack prices pulled on {edition.pulledOn}
        </caption>
        <thead>
          <tr className="border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">Listing</th>
            <th className="px-4 py-3 font-semibold">30</th>
            <th className="px-4 py-3 font-semibold">60</th>
            <th className="px-4 py-3 font-semibold">90</th>
          </tr>
        </thead>
        <tbody>
          {edition.rows.map((row) => (
            <tr key={row.slug} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <Link href={`/product/${row.slug}`} className="font-medium text-foreground hover:text-primary">
                  {row.name}
                </Link>
              </td>
              <td className="px-4 py-3 tabular-nums">{formatUsd(row.packs[30])}</td>
              <td className="px-4 py-3 tabular-nums">{formatUsd(row.packs[60])}</td>
              <td className="px-4 py-3 tabular-nums">{formatUsd(row.packs[90])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
