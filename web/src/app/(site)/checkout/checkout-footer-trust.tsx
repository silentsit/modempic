import { ShieldCheck } from "lucide-react";

export function CheckoutFooterTrust() {
  return (
    <div className="mt-16 grid gap-10 border-t border-border pt-12 md:grid-cols-2 md:items-center">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-subtle">
          <ShieldCheck className="h-6 w-6 text-primary" strokeWidth={1.5} aria-hidden />
        </span>
        <div>
          <p className="text-lg font-semibold tracking-tight text-foreground">100% satisfaction commitment</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            We stand behind every order. If something isn&apos;t right with your shipment, reach out and we&apos;ll make it right according to our
            refund policy.
          </p>
        </div>
      </div>
      <blockquote className="rounded-2xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
        <p className="text-foreground">&ldquo;Fast, discreet, and exactly as described. The checkout was straightforward—I knew what I was paying
        before I committed.&rdquo;</p>
        <footer className="mt-3 text-xs font-medium text-muted-foreground">— Mei Chen</footer>
      </blockquote>
    </div>
  );
}
