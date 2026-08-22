import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/domain/money";
import { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/domain/checkout-pricing";

export function CartTrustAside({ subtotalCents }: { subtotalCents: number }) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Order Summary</h2>
        <p className="mt-4 flex justify-between text-sm text-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums font-medium">{formatUsd(subtotalCents)}</span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Checkout: {formatUsd(FLAT_SHIPPING_CENTS)} shipping (free when discounted subtotal is over{" "}
          {formatUsd(FREE_SHIPPING_THRESHOLD_CENTS)}). Tax $0.
        </p>
        <Button className="mt-6 h-12 w-full text-base font-semibold" asChild>
          <Link href="/checkout">Proceed to checkout</Link>
        </Button>
      </div>
      <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-accent-subtle px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2} aria-hidden />
        <p>
          Secure card checkout by default. Cryptocurrency remains available. Sign in once to save your cart and receive
          order updates.
        </p>
      </div>
    </aside>
  );
}
