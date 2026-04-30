/**
 * Payment marks for PDP — decorative placeholders; swap for brand-approved assets if needed.
 */

function PaymentCardLogos() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5" aria-label="Accepted payment methods">
      <span className="inline-flex h-8 min-w-[52px] items-center justify-center rounded bg-[#1A1F71] px-2 text-[10px] font-bold uppercase tracking-wide text-white">
        Visa
      </span>
      <span className="inline-flex h-8 min-w-[52px] items-center justify-center rounded bg-[#EB001B] px-1 text-[9px] font-bold text-white ring-1 ring-[#F79E1B]">
        <span className="rounded-full bg-[#F79E1B] px-1.5 py-0.5">MC</span>
      </span>
      <span className="inline-flex h-8 min-w-[52px] items-center justify-center rounded bg-[#006FCF] px-2 text-[10px] font-bold uppercase text-white">
        Amex
      </span>
      <span className="inline-flex h-8 min-w-[52px] items-center justify-center rounded bg-[#FF6000] px-2 text-[10px] font-bold text-white">
        Discover
      </span>
    </div>
  );
}

export function GuaranteedSafeCheckout() {
  return (
    <fieldset className="relative mt-8 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 pb-5 pt-1 text-center shadow-sm">
      <legend className="mx-auto px-3 text-sm font-semibold tracking-wide text-[var(--foreground)] bg-[var(--card)]">
        Guaranteed Safe Checkout
      </legend>
      <div className="mt-3">
        <PaymentCardLogos />
      </div>
    </fieldset>
  );
}
