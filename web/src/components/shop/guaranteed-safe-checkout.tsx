/**
 * Payment marks for PDP — text badges avoid implying unsupported card checkout brands.
 */

const badgeCls =
  "inline-flex h-8 min-w-[72px] items-center justify-center rounded-full border px-3.5 text-[10px] font-semibold uppercase tracking-[0.08em]";

function PaymentBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3" aria-label="Accepted payment methods">
      <span className={`${badgeCls} border-border bg-muted text-foreground`}>Paymento</span>
      <span className={`${badgeCls} border-primary/25 bg-primary-subtle text-primary`}>Cryptocurrency</span>
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
        Checkout is handled by Paymento. You pay with the crypto asset you select.
      </p>
    </fieldset>
  );
}
