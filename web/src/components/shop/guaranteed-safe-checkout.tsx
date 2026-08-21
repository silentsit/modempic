/**
 * Payment marks for PDP — card is the default method; crypto remains available.
 */

const badgeCls =
  "inline-flex h-8 min-w-[72px] items-center justify-center rounded-full border px-3.5 text-[10px] font-semibold uppercase tracking-[0.08em]";

function PaymentBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3" aria-label="Accepted payment methods">
      <span className={`${badgeCls} border-primary/25 bg-primary-subtle text-primary`}>Card</span>
      <span className={`${badgeCls} border-border bg-muted text-foreground`}>Apple Pay</span>
      <span className={`${badgeCls} border-border bg-muted text-foreground`}>Crypto</span>
      <span className={`${badgeCls} min-w-[52px] border-border bg-muted text-muted-foreground`}>SSL</span>
    </div>
  );
}

export function GuaranteedSafeCheckout() {
  return (
    <fieldset className="relative mt-8 rounded-2xl border border-border bg-card px-4 pb-5 pt-1 text-center">
      <legend className="mx-auto bg-card px-3 text-sm font-semibold tracking-wide text-foreground">
        Secure Payment
      </legend>
      <div className="mt-3">
        <PaymentBadges />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Checkout is card by default (Apple Pay, Google Pay, Visa, Mastercard). Cryptocurrency remains available.
      </p>
    </fieldset>
  );
}
