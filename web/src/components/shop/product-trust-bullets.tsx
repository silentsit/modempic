import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/domain/checkout-pricing";
import { formatUsd } from "@/lib/domain/money";

export function ProductTrustBullets() {
  return (
    <>
      <ul className="mt-6 space-y-2 text-sm leading-snug text-foreground">
        <li className="flex gap-2.5">
          <span className="shrink-0 text-primary" aria-hidden>
            →
          </span>
          <span>
            <strong>FREE</strong> tracked delivery on orders over {formatUsd(FREE_SHIPPING_THRESHOLD_CENTS)}
          </span>
        </li>
        <li className="flex gap-2.5">
          <span className="shrink-0 text-primary" aria-hidden>
            →
          </span>
          <span>
            <strong>Discreet</strong> plain packaging on every order
          </span>
        </li>
        <li className="flex gap-2.5">
          <span className="shrink-0 text-primary" aria-hidden>
            →
          </span>
          <span>
            <strong>Secure</strong> card checkout (Apple Pay, Google Pay, Visa, Mastercard)
          </span>
        </li>
        <li className="flex gap-2.5">
          <span className="shrink-0 text-primary" aria-hidden>
            →
          </span>
          <span>
            <strong>Clear</strong> labels: name, strength, and pack size
          </span>
        </li>
      </ul>
      <p className="mt-4 text-sm italic text-muted-foreground">Email support within 24 hours</p>
    </>
  );
}
