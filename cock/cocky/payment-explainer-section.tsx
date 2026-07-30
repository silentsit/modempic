import { Container } from "@/components/site/container";

export function PaymentExplainerSection() {
  return (
    <section
      className="border-b border-[var(--border)] bg-white py-16 sm:py-20"
      aria-labelledby="payment-heading"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="payment-heading" className="text-2xl font-semibold sm:text-3xl">
            Simple Payment Process
          </h2>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Seamless payment process. We accept payments in crypto, or you can use your credit/debit card to buy the
            crypto in 3 min - no KYC.
          </p>
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
              <p className="text-sm font-semibold text-[var(--primary)]">Step 1</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Choose your product</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                Pick a package on any product page and tap Buy now — we take you straight to checkout.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
              <p className="text-sm font-semibold text-[var(--primary)]">Step 2</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Pay with crypto or credit card</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                Crypto goes directly to our wallet. For card, open Guardarian to buy crypto, then return here to send
                funds and confirm your TxID.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
