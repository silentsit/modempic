"use client";

import { useMemo, useState } from "react";
import { SafeLink } from "@/components/site/safe-link";
import { formatTierPriceLine, type VariantTier } from "@/lib/product-variants";

/**
 * "Buy now" routes to `/checkout?buy=<slug>&qty=<n>&tier=<i>` for everyone — guests included.
 * The checkout route requires auth and redirects unauthenticated visitors to /login (preserving the query),
 * so visitors aren't blocked here on the PDP and only have to sign in or register to finalise the order.
 */
export function ProductPurchaseSection({
  slug,
  tiers,
}: {
  slug: string;
  tiers: VariantTier[];
}) {
  const needsTierChoice = tiers.length > 1;
  const [tierIdx, setTierIdx] = useState<number | null>(needsTierChoice ? null : tiers.length === 1 ? 0 : null);
  const [qty, setQty] = useState(1);

  const canBuy = useMemo(() => {
    if (tiers.length === 0) return true;
    if (tiers.length === 1) return true;
    return tierIdx !== null;
  }, [tiers.length, tierIdx]);

  function bump(delta: number) {
    setQty((q) => Math.min(99, Math.max(1, q + delta)));
  }

  const params = new URLSearchParams({ buy: slug });
  if (qty > 1) params.set("qty", String(qty));
  if (tierIdx !== null) params.set("tier", String(tierIdx));
  const buyHref = `/checkout?${params.toString()}`;

  return (
    <div className="mt-8 border-t border-[var(--border)] pt-8">
      {needsTierChoice ? (
        <div className="space-y-2">
          <label htmlFor="tier-select" className="text-sm font-semibold text-[var(--foreground)]">
            Select Quantity
          </label>
          <select
            id="tier-select"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30"
            value={tierIdx === null ? "" : String(tierIdx)}
            onChange={(e) => {
              const v = e.target.value;
              setTierIdx(v === "" ? null : Number(v));
            }}
          >
            <option value="">Choose an option</option>
            {tiers.map((t, i) => (
              <option key={`${i}-${t.label.slice(0, 40)}`} value={String(i)}>
                {formatTierPriceLine(t)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className={`flex flex-wrap items-stretch gap-3 ${needsTierChoice ? "mt-6" : ""}`}>
        <div className="flex min-h-[48px] min-w-[140px] items-stretch rounded-md border border-[var(--border)] bg-[var(--background)]">
          <button
            type="button"
            className="px-3 text-lg leading-none text-[var(--foreground)] transition hover:bg-[var(--muted)] disabled:opacity-40"
            aria-label="Decrease quantity"
            disabled={qty <= 1}
            onClick={() => bump(-1)}
          >
            −
          </button>
          <span className="flex min-w-[2.5rem] items-center justify-center border-x border-[var(--border)] text-sm font-medium tabular-nums">
            {qty}
          </span>
          <button
            type="button"
            className="px-3 text-lg leading-none text-[var(--foreground)] transition hover:bg-[var(--muted)] disabled:opacity-40"
            aria-label="Increase quantity"
            disabled={qty >= 99}
            onClick={() => bump(1)}
          >
            +
          </button>
        </div>
        {canBuy ? (
          <SafeLink
            href={buyHref}
            className="flex min-h-[48px] min-w-[160px] flex-1 items-center justify-center rounded-md bg-emerald-700 px-6 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            Buy now
          </SafeLink>
        ) : (
          <button
            type="button"
            className="min-h-[48px] min-w-[160px] flex-1 cursor-not-allowed rounded-md bg-emerald-700 px-6 text-sm font-bold uppercase tracking-wide text-white opacity-60 shadow-sm dark:bg-emerald-600"
            disabled
            aria-disabled="true"
          >
            Buy now
          </button>
        )}
      </div>
    </div>
  );
}
