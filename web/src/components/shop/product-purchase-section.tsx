"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buyNowAction } from "@/lib/actions/cart";
import { formatTierPriceLine, type VariantTier } from "@/lib/product-variants";

export function ProductPurchaseSection({
  productId,
  tiers,
}: {
  productId: string;
  tiers: VariantTier[];
}) {
  const router = useRouter();
  const needsTierChoice = tiers.length > 1;
  const [tierIdx, setTierIdx] = useState<number | null>(needsTierChoice ? null : tiers.length === 1 ? 0 : null);
  const [qty, setQty] = useState(1);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canBuy = useMemo(() => {
    if (tiers.length === 0) return true;
    if (tiers.length === 1) return true;
    return tierIdx !== null;
  }, [tiers.length, tierIdx]);

  function bump(delta: number) {
    setQty((q) => Math.min(99, Math.max(1, q + delta)));
  }

  async function buy() {
    if (!canBuy) return;
    setMsg(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("productId", productId);
      fd.set("quantity", String(qty));
      if (tiers.length > 1) {
        if (tierIdx === null) return;
        fd.set("tierIndex", String(tierIdx));
      } else if (tiers.length === 1) {
        fd.set("tierIndex", "0");
      }
      await buyNowAction(fd);
      router.push("/checkout");
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setMsg(
        m.includes("CART_REJECTED")
          ? "This product isn’t available or the request was invalid."
          : "Please sign in to continue to checkout.",
      );
    } finally {
      setPending(false);
    }
  }

  function onBuyClick() {
    void buy().catch(() => {
      setMsg("Something went wrong. Please try again.");
      setPending(false);
    });
  }

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
            disabled={pending || qty <= 1}
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
            disabled={pending || qty >= 99}
            onClick={() => bump(1)}
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="min-h-[48px] min-w-[160px] flex-1 rounded-md bg-emerald-700 px-6 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          disabled={pending || !canBuy}
          onClick={onBuyClick}
        >
          {pending ? "Please wait…" : "Buy now"}
        </button>
      </div>
      {msg ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{msg}</p> : null}
    </div>
  );
}
