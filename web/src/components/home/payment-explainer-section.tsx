import { ArrowDown } from "lucide-react";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/home/reveal";
import { Badge } from "@/components/ui/badge";

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
      className="border-b border-border bg-section-tint-accent py-16 sm:py-20"
      aria-labelledby="payment-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-3xl text-center">
          <Badge variant="accent" className="mx-auto">
            How it works
          </Badge>
          <h2 id="payment-heading" className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Simple Payment Process
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Checkout is crypto-only through Paymento. Choose your asset and complete payment on their secure page.
          </p>
          <div className="mt-10 text-left">
            {steps.map((step, i) => (
              <div key={step.n}>
                <article className="flex items-start gap-5 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-7">
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
                {i < steps.length - 1 ? (
                  <div className="flex justify-center py-2" aria-hidden>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                      <ArrowDown className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
