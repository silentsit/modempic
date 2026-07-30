import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/domain/money";
import { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/domain/checkout-pricing";

export function CartTrustAside({ subtotalCents }: { subtotalCents: number }) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <p className="mt-4 flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatUsd(subtotalCents)}</span>
        </p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Checkout: {formatUsd(FLAT_SHIPPING_CENTS)} shipping (free when discounted subtotal is over{" "}
          {formatUsd(FREE_SHIPPING_THRESHOLD_CENTS)}). Tax $0.
        </p>
        <Button className="mt-6 h-12 w-full text-base font-semibold" asChild>
          <Link href="/checkout">Proceed to checkout</Link>
        </Button>
      </div>
      <div className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" strokeWidth={2.5} aria-hidden />
        <p>
          Secure crypto checkout via BTCPay or Paymento. Sign in once to save your cart and receive order updates.
        </p>
      </div>
    </aside>
  );
}
