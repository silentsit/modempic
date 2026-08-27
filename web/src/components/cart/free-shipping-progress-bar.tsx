import Link from "next/link";
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  getFreeShippingProgress,
} from "@/lib/domain/checkout-pricing";
import { formatUsd } from "@/lib/domain/money";

type FreeShippingProgressBarProps = {
  subtotalAfterDiscountCents: number;
  showContinueShopping?: boolean;
};

export function FreeShippingProgressBar({
  subtotalAfterDiscountCents,
  showContinueShopping = false,
}: FreeShippingProgressBarProps) {
  const { qualifies, needCents, progressPct } = getFreeShippingProgress(subtotalAfterDiscountCents);

  if (qualifies) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
        <p className="font-medium">You&apos;ve unlocked FREE Worldwide Shipping!</p>
        <p className="mt-1 text-emerald-900/90 dark:text-emerald-200/90">
          Your order subtotal is over {formatUsd(FREE_SHIPPING_THRESHOLD_CENTS)}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/90 px-4 py-3 dark:border-sky-900 dark:bg-sky-950/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-sky-950 dark:text-sky-100">
          Add <strong>{formatUsd(needCents)}</strong> more to unlock{" "}
          <strong>FREE Worldwide Shipping!</strong>
        </p>
        {showContinueShopping ? (
          <Link
            href="/shop"
            className="shrink-0 text-sm font-medium text-sky-800 underline-offset-2 hover:underline dark:text-sky-300"
          >
            Continue shopping
          </Link>
        ) : null}
      </div>
      <div className="mt-3">
        <div
          className="h-2.5 overflow-hidden rounded-full bg-white/80 dark:bg-sky-950/60"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPct)}
          aria-label={`${Math.round(progressPct)}% progress toward free worldwide shipping`}
        >
          <div
            className="h-full rounded-full bg-sky-500 transition-[width] duration-300 dark:bg-sky-400"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-sky-800/80 dark:text-sky-300/90">
          <span>{formatUsd(0)}</span>
          <span className="text-right">Over {formatUsd(FREE_SHIPPING_THRESHOLD_CENTS)}</span>
        </div>
      </div>
    </div>
  );
}
