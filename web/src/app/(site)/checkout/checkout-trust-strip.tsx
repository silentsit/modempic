import { Headphones, Lock, Truck, Wallet } from "lucide-react";

export function CheckoutTrustStrip() {
  return (
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground sm:justify-end sm:text-sm">
      <li className="flex items-center gap-2">
        <Lock className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
        <span>TLS-encrypted session</span>
      </li>
      <li className="flex items-center gap-2">
        <Wallet className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
        <span>Paymento crypto routing</span>
      </li>
      <li className="flex items-center gap-2">
        <Truck className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
        <span>Tracked fulfillment</span>
      </li>
      <li className="flex items-center gap-2">
        <Headphones className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
        <span>Email support</span>
      </li>
    </ul>
  );
}
