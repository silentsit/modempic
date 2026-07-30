import { ShieldCheck } from "lucide-react";

export function CheckoutFooterTrust() {
  return (
    <div className="mt-14 grid gap-8 border-t border-[var(--border)] pt-10 md:grid-cols-2 md:items-center">
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-10 w-10 shrink-0 text-[var(--primary)]" strokeWidth={1.25} aria-hidden />
        <div>
          <p className="text-lg font-semibold text-[var(--foreground)]">100% satisfaction commitment</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            We stand behind every order. If something isn&apos;t right with your shipment, reach out and we&apos;ll make it right according to our
            refund policy.
          </p>
        </div>
      </div>
      <blockquote className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm leading-relaxed text-[var(--muted-foreground)] shadow-sm">
        <p className="text-[var(--foreground)]">&ldquo;Fast, discreet, and exactly as described. The checkout was straightforward—I knew what I was paying
        before I committed.&rdquo;</p>
        <footer className="mt-3 text-xs font-medium text-[var(--foreground)]">— Mei Chen</footer>
      </blockquote>
    </div>
  );
}
