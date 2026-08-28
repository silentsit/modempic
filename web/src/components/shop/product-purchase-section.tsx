"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SafeLink } from "@/components/site/safe-link";
import { addToCartAction } from "@/lib/actions/cart";
import { formatUsd } from "@/lib/domain/money";
import {
  defaultPackTierIndex,
  formatTierPriceLine,
  formatUsdEachFromCents,
  formatUsdTierLine,
  tierLabelBaseOnly,
  tierLabelLeadingQuantity,
  type VariantTier,
} from "@/lib/product-variants";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * "Buy now" routes to `/checkout?buy=<slug>&qty=<n>&tier=<i>` for guests and signed-in customers.
 */
export function ProductPurchaseSection({
  productId,
  slug,
  tiers,
  productName,
  headlinePrice,
}: {
  productId: string;
  slug: string;
  tiers: VariantTier[];
  productName: string;
  headlinePrice: string;
}) {
  const needsTierChoice = tiers.length > 1;
  const [tierIdx, setTierIdx] = useState<number | null>(() =>
    tiers.length === 0 ? null : defaultPackTierIndex(tiers),
  );
  const [qty, setQty] = useState(1);
  const [showSticky, setShowSticky] = useState(false);
  const [cartMsg, setCartMsg] = useState<string | null>(null);
  const [cartPending, startCartTransition] = useTransition();
  const purchaseRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
    "flex min-h-[48px] w-full flex-1 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-w-[160px] sm:w-auto";

  const cartButtonClass =
    "flex min-h-[48px] w-full flex-1 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-w-[160px] sm:w-auto";

  function addToCart() {
    setCartMsg(null);
    startCartTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("productId", productId);
        fd.set("quantity", String(qty));
        if (tierIdx !== null) fd.set("tierIndex", String(tierIdx));
        await addToCartAction(fd);
        router.push("/cart");
      } catch {
        setCartMsg("Could not add to cart. Please try again.");
      }
    });
  }

  return (
    <>
      <div ref={purchaseRef} className="mt-8 border-t border-border pt-8">
        {needsTierChoice ? (
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">Choose Pack Size</legend>
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
                      "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition-colors",
                      "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                      selected
                        ? "border-primary bg-primary-subtle"
                        : "border-border bg-background hover:border-primary/40",
                    )}
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <input
                        type="radio"
                        name="tier"
                        className="mt-1 h-4 w-4 shrink-0 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        checked={selected}
                        onChange={() => setTierIdx(i)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">{label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {formatUsdEachFromCents(eachCents)} each
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold tabular-nums text-foreground">
                        {formatUsdTierLine(tier.priceCents)}
                      </span>
                      {tier.compareAtCents != null && tier.compareAtCents > tier.priceCents ? (
                        <span className="block text-xs text-muted-foreground line-through">
                          {formatUsd(tier.compareAtCents)}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
            {tierIdx === null ? (
              <p className="text-xs text-accent">Select a pack size to continue.</p>
            ) : null}
          </fieldset>
        ) : tiers.length === 1 ? (
          <p className="text-sm text-muted-foreground">
            Pack: <span className="font-medium text-foreground">{formatTierPriceLine(tiers[0])}</span>
          </p>
        ) : null}

        <div className={cn("flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap", needsTierChoice && "mt-6")}>
          <div className="flex min-h-[48px] w-full items-stretch rounded-full border border-border bg-background sm:w-auto sm:min-w-[140px]">
            <button
              type="button"
              className="rounded-l-full px-4 text-lg leading-none text-foreground transition-colors hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Decrease quantity"
              disabled={qty <= 1}
              onClick={() => bump(-1)}
            >
              −
            </button>
            <span className="flex min-w-[2.5rem] items-center justify-center border-x border-border text-sm font-medium tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              className="rounded-r-full px-4 text-lg leading-none text-foreground transition-colors hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <button
              type="button"
              className={cn(buyButtonClass, "cursor-not-allowed opacity-50")}
              disabled
              aria-disabled="true"
            >
              Buy now
            </button>
          )}
          <button
            type="button"
            className={cn(cartButtonClass, (!canBuy || cartPending) && "cursor-not-allowed opacity-50")}
            disabled={!canBuy || cartPending}
            onClick={() => addToCart()}
          >
            {cartPending ? "Adding…" : "Add to cart"}
          </button>
        </div>
        {cartMsg ? <p className="mt-2 text-sm text-destructive">{cartMsg}</p> : null}
      </div>

      {/* Mobile sticky buy bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-200 lg:hidden",
          showSticky ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
        aria-hidden={!showSticky}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3 pr-16">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{productName}</p>
            <p className="text-sm font-medium tabular-nums text-primary">{displayPrice}</p>
          </div>
          {canBuy ? (
            <SafeLink
              href={buyHref}
              className="shrink-0 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Buy now
            </SafeLink>
          ) : (
            <button
              type="button"
              className="shrink-0 cursor-not-allowed rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground opacity-50"
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
