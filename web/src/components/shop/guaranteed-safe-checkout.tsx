/**
 * Payment marks for PDP — text badges avoid implying unsupported card checkout brands.
 */

function PaymentBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5" aria-label="Accepted payment methods">
      <span className="inline-flex h-8 min-w-[72px] items-center justify-center rounded bg-[#0f172a] px-3 text-[10px] font-bold uppercase tracking-wide text-white">
        BTCPay
      </span>
      <span className="inline-flex h-8 min-w-[72px] items-center justify-center rounded bg-[#14532d] px-3 text-[10px] font-bold uppercase tracking-wide text-white">
        Paymento
      </span>
      <span className="inline-flex h-8 min-w-[72px] items-center justify-center rounded bg-[#ecfdf5] px-3 text-[10px] font-bold uppercase tracking-wide text-[#14532d] ring-1 ring-[#86efac]">
        Card on-ramp
      </span>
      <span className="inline-flex h-8 min-w-[52px] items-center justify-center rounded bg-[var(--muted)] px-3 text-[10px] font-bold uppercase tracking-wide text-[var(--foreground)] ring-1 ring-[var(--border)]">
        SSL
      </span>
    </div>
  );
}

export function GuaranteedSafeCheckout() {
  return (
    <fieldset className="relative mt-8 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 pb-5 pt-1 text-center shadow-sm">
      <legend className="mx-auto px-3 text-sm font-semibold tracking-wide text-[var(--foreground)] bg-[var(--card)]">
        Secure Payment Options
      </legend>
      <div className="mt-3">
        <PaymentBadges />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
        Bitcoin routes through BTCPay; supported stablecoins and altcoins route through Paymento.
      </p>
    </fieldset>
  );
}
