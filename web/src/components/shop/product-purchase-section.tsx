"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SafeLink } from "@/components/site/safe-link";
import { formatUsd } from "@/lib/domain/money";
import {
  formatTierPriceLine,
  formatUsdEachFromCents,
  formatUsdTierLine,
  tierLabelBaseOnly,
  tierLabelLeadingQuantity,
  type VariantTier,
} from "@/lib/product-variants";
import { cn } from "@/lib/utils";

/**
 * "Buy now" routes to `/checkout?buy=<slug>&qty=<n>&tier=<i>` for everyone — guests included.
 * The checkout route requires auth and redirects unauthenticated visitors to /login (preserving the query),
 * so visitors aren't blocked here on the PDP and only have to sign in or register to finalise the order.
 */
export function ProductPurchaseSection({
  slug,
  tiers,
  productName,
  headlinePrice,
}: {
  slug: string;
  tiers: VariantTier[];
  productName: string;
  headlinePrice: string;
}) {
  const needsTierChoice = tiers.length > 1;
  const [tierIdx, setTierIdx] = useState<number | null>(needsTierChoice ? null : tiers.length === 1 ? 0 : null);
  const [qty, setQty] = useState(1);
  const [showSticky, setShowSticky] = useState(false);
  const purchaseRef = useRef<HTMLDivElement>(null);

  const selectedTier = tierIdx !== null ? tiers[tierIdx] : tiers.length === 1 ? tiers[0] : null;

  const canBuy = useMemo(() => {
    if (tiers.length === 0) return true;
    if (tiers.length === 1) return true;
    return tierIdx !== null;
  }, [tiers.length, tierIdx]);

  const displayPrice = useMemo(() => {
    if (selectedTier) return formatUsdTierLine(selectedTier.priceCents);
    return headlinePrice;
  }, [selectedTier, headlinePrice]);

  function bump(delta: number) {
    setQty((q) => Math.min(99, Math.max(1, q + delta)));
  }

  const params = new URLSearchParams({ buy: slug });
  if (qty > 1) params.set("qty", String(qty));
  if (tierIdx !== null) params.set("tier", String(tierIdx));
  const buyHref = `/checkout?${params.toString()}`;

  useEffect(() => {
    const el = purchaseRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0, rootMargin: "-72px 0px 0px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const buyButtonClass =
    "flex min-h-[48px] min-w-[160px] flex-1 items-center justify-center rounded-md bg-emerald-700 px-6 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700";

  return (
    <>
      <div ref={purchaseRef} className="mt-8 border-t border-[var(--border)] pt-8">
        {needsTierChoice ? (
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-[var(--foreground)]">Choose pack size</legend>
            <div className="space-y-2" role="radiogroup" aria-label="Pack size">
              {tiers.map((tier, i) => {
                const label = tierLabelBaseOnly(tier.label);
                const parsedQty = tierLabelLeadingQuantity(label);
                const unitQty = parsedQty != null && parsedQty > 0 ? parsedQty : 1;
                const eachCents = Math.round(tier.priceCents / unitQty);
                const selected = tierIdx === i;

                return (
                  <label
                    key={`${i}-${tier.label.slice(0, 40)}`}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition",
                      selected
                        ? "border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-600/30 dark:border-emerald-500 dark:bg-emerald-950/25"
                        : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/40",
                    )}
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <input
                        type="radio"
                        name="tier"
                        className="mt-1 h-4 w-4 shrink-0 accent-emerald-700"
                        checked={selected}
                        onChange={() => setTierIdx(i)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[var(--foreground)]">{label}</span>
                        <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                          {formatUsdEachFromCents(eachCents)} each
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold tabular-nums text-[var(--foreground)]">
                        {formatUsdTierLine(tier.priceCents)}
                      </span>
                      {tier.compareAtCents != null && tier.compareAtCents > tier.priceCents ? (
                        <span className="block text-xs text-[var(--muted-foreground)] line-through">
                          {formatUsd(tier.compareAtCents)}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
            {tierIdx === null ? (
              <p className="text-xs text-amber-800 dark:text-amber-200">Select a pack size to continue.</p>
            ) : null}
          </fieldset>
        ) : tiers.length === 1 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Pack: <span className="font-medium text-[var(--foreground)]">{formatTierPriceLine(tiers[0])}</span>
          </p>
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
            <SafeLink href={buyHref} className={buyButtonClass}>
              Buy now
            </SafeLink>
          ) : (
            <button type="button" className={cn(buyButtonClass, "cursor-not-allowed opacity-60")} disabled aria-disabled="true">
              Buy now
            </button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--background)]/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur transition-transform duration-200 lg:hidden",
          showSticky ? "translate-y-0" : "translate-y-full pointer-events-none",
        )}
        aria-hidden={!showSticky}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">{productName}</p>
            <p className="text-sm font-medium tabular-nums text-emerald-800 dark:text-emerald-300">{displayPrice}</p>
          </div>
          {canBuy ? (
            <SafeLink href={buyHref} className="shrink-0 rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white">
              Buy now
            </SafeLink>
          ) : (
            <button
              type="button"
              className="shrink-0 cursor-not-allowed rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white opacity-60"
              disabled
            >
              Buy now
            </button>
          )}
        </div>
      </div>
    </>
  );
}
