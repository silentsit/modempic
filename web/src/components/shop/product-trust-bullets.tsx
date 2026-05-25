import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/domain/checkout-pricing";
import { formatUsd } from "@/lib/domain/money";

export function ProductTrustBullets() {
  return (
    <>
      <ul className="mt-6 space-y-1 text-sm leading-snug text-[var(--foreground)]">
        <li className="flex gap-2">
          <span className="shrink-0 text-[var(--muted-foreground)]" aria-hidden>
            →
          </span>
          <span>
            <strong>FREE</strong> express delivery on orders over {formatUsd(FREE_SHIPPING_THRESHOLD_CENTS)}
          </span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 text-[var(--muted-foreground)]" aria-hidden>
            →
          </span>
          <span>
            <strong>Guaranteed</strong> delivery worldwide
          </span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 text-[var(--muted-foreground)]" aria-hidden>
            →
          </span>
          <span>
            <strong>Secured</strong> &amp; discreet packaging
          </span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 text-[var(--muted-foreground)]" aria-hidden>
            →
          </span>
          <span>
            <strong>Enjoy</strong> discounts on every return purchase
          </span>
        </li>
      </ul>
      <p className="mt-4 text-sm italic text-[var(--muted-foreground)]">24-hour customer support via email</p>
    </>
  );
}
