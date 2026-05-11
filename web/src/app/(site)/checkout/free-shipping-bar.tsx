"use client";

import Link from "next/link";
import { FREE_SHIPPING_QUALIFY_AT_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/domain/checkout-pricing";
import { formatUsd } from "@/lib/domain/money";

export function FreeShippingProgressBar({ subtotalAfterDiscountCents }: { subtotalAfterDiscountCents: number }) {
  const qualifies = subtotalAfterDiscountCents > FREE_SHIPPING_THRESHOLD_CENTS;
  const need = Math.max(0, FREE_SHIPPING_QUALIFY_AT_CENTS - subtotalAfterDiscountCents);
  const pct = Math.min(100, (subtotalAfterDiscountCents / FREE_SHIPPING_QUALIFY_AT_CENTS) * 100);

  if (qualifies) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
        <span className="font-medium">You have free shipping on this order.</span>{" "}
        <span className="text-emerald-900/90 dark:text-emerald-200/90">
          Your discounted subtotal is above {formatUsd(FREE_SHIPPING_THRESHOLD_CENTS)}.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/90 px-4 py-3 dark:border-sky-900 dark:bg-sky-950/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-sky-950 dark:text-sky-100">
          You only need <strong>{formatUsd(need)}</strong> more for free shipping (discounted subtotal over {formatUsd(FREE_SHIPPING_THRESHOLD_CENTS)}).
        </p>
        <Link href="/shop" className="shrink-0 text-sm font-medium text-sky-800 underline-offset-2 hover:underline dark:text-sky-300">
          Continue shopping
        </Link>
      </div>
      <div className="mt-3">
        <div className="h-2.5 overflow-hidden rounded-full bg-white/80 dark:bg-sky-950/60">
          <div
            className="h-full rounded-full bg-sky-500 transition-[width] duration-300 dark:bg-sky-400"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-sky-800/80 dark:text-sky-300/90">
          <span>$0.00</span>
          <span className="text-right">Over {formatUsd(FREE_SHIPPING_THRESHOLD_CENTS)}</span>
        </div>
      </div>
    </div>
  );
}
