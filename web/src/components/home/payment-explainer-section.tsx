import { Container } from "@/components/site/container";

const steps = [
  {
    n: 1,
    title: "Choose your product",
    body: "Pick a package on any product page and tap Buy now or Add to cart — then head to checkout.",
  },
  {
    n: 2,
    title: "Pay with crypto",
    body: "Select your asset on Paymento's secure checkout page and send funds. Paymento confirms the transaction and we fulfill your order.",
  },
] as const;

export function PaymentExplainerSection() {
  return (
    <section
      className="border-b border-border bg-background py-16 sm:py-20"
      aria-labelledby="payment-heading"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="payment-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Simple Payment Process
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Checkout is crypto-only through Paymento. Choose your asset and complete payment on their secure page.
          </p>
          <div className="mt-10 space-y-5 text-left">
            {steps.map((step) => (
              <article
                key={step.n}
                className="flex items-start gap-5 rounded-2xl border border-border bg-card p-6 sm:p-7"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold tabular-nums text-primary"
                  aria-hidden
                >
                  {step.n}
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
