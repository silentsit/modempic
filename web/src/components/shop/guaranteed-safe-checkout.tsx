/**
 * Payment marks for PDP — card is the default method; crypto remains available.
 */

const pillCls =
  "inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-white px-3 shadow-[0_1px_0_rgba(15,23,42,0.04)]";

function PaymentBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5" aria-label="Accepted payment methods">
      <span className={pillCls}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local brand marks; avoid optimizer cropping logos */}
        <img src="/trust-badges/visa.png" alt="Visa" className="h-4 w-auto" width={48} height={16} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/trust-badges/mastercard.png" alt="Mastercard" className="h-6 w-auto" width={36} height={24} />
      </span>
      <span className={pillCls}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/trust-badges/apple-pay.png" alt="Apple Pay" className="h-5 w-auto" width={48} height={20} />
      </span>
      <span className={pillCls}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/trust-badges/google-pay.png" alt="Google Pay" className="h-5 w-auto" width={52} height={20} />
      </span>
      <span className={pillCls}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/trust-badges/crypto.svg" alt="Cryptocurrency" className="h-6 w-6" width={24} height={24} />
      </span>
      <span className={pillCls}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/trust-badges/ssl-lock.svg" alt="SSL encrypted checkout" className="h-6 w-auto" width={56} height={32} />
      </span>
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
