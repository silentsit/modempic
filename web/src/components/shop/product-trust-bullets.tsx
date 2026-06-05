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
            <strong>Tracked</strong> order updates after checkout
          </span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 text-[var(--muted-foreground)]" aria-hidden>
            →
          </span>
          <span>
            <strong>Secure</strong> crypto payment routing
          </span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 text-[var(--muted-foreground)]" aria-hidden>
            →
          </span>
          <span>
            <strong>Research-use</strong> product documentation where available
          </span>
        </li>
      </ul>
      <p className="mt-4 text-sm italic text-[var(--muted-foreground)]">24-hour customer support via email</p>
    </>
  );
}
