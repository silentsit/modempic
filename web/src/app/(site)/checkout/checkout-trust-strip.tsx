import { Headphones, Lock, Wallet } from "lucide-react";

export function CheckoutTrustStrip() {
  return (
    <ul className="flex flex-wrap items-center justify-end gap-x-8 gap-y-3 text-sm text-[var(--muted-foreground)]">
      <li className="flex items-center gap-2">
        <Lock className="h-4 w-4 shrink-0 text-[var(--primary)]" strokeWidth={2} aria-hidden />
        <span>Encrypted checkout</span>
      </li>
      <li className="flex items-center gap-2">
        <Headphones className="h-4 w-4 shrink-0 text-[var(--primary)]" strokeWidth={2} aria-hidden />
        <span>Email support available</span>
      </li>
      <li className="flex items-center gap-2">
        <Wallet className="h-4 w-4 shrink-0 text-[var(--primary)]" strokeWidth={2} aria-hidden />
        <span>Crypto payment guidance</span>
      </li>
    </ul>
  );
}
