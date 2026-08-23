import { ArrowDown, CreditCard, PackageCheck, ShoppingCart } from "lucide-react";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/home/reveal";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    n: 1,
    icon: ShoppingCart,
    title: "Select Your Package",
    body: "Choose your preferred quantity or bundle, then proceed to checkout.",
  },
  {
    n: 2,
    icon: CreditCard,
    title: "Choose Your Payment Method",
    body: "Pay with Apple Pay, Google Pay, Visa, Mastercard, or American Express. Cryptocurrency is also available.",
    paymentMethods: ["Apple Pay", "Google Pay", "Visa", "Mastercard", "Crypto"],
  },
  {
    n: 3,
    icon: PackageCheck,
    title: "Confirmation & Discreet Shipping",
    body: "Receive order confirmation by email. Tracking is provided after dispatch, and orders ship in plain packaging.",
  },
] as const;

export function PaymentExplainerSection() {
  return (
    <section
      className="border-b border-border bg-section-tint-accent py-16 sm:py-20"
      aria-labelledby="payment-heading"
    >
      <Container>
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="accent" className="mx-auto">
              Safe &amp; Discreet
            </Badge>
            <h2 id="payment-heading" className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Simple, Secure Checkout
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Choose your products, pay through a secure hosted checkout, and receive discreet delivery updates by
              email.
            </p>
          </div>

          <ol className="mt-10 grid list-none gap-y-0 text-left md:grid-cols-3 md:gap-5">
            {steps.map((step, i) => {
              const Icon = step.icon;

              return (
                <li key={step.n} className="relative">
                  <article className="h-full rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-7">
                    <div className="flex items-center justify-between">
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-subtle text-primary"
                        aria-hidden
                      >
                        <Icon className="h-6 w-6" strokeWidth={1.75} />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Step {step.n}
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

                    {"paymentMethods" in step ? (
                      <div className="mt-5 flex flex-wrap gap-2" aria-label="Accepted payment methods">
                        {step.paymentMethods.map((method) => (
                          <span
                            key={method}
                            className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground"
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>

                  {i < steps.length - 1 ? (
                    <div className="flex justify-center py-2 md:hidden" aria-hidden>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                        <ArrowDown className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </Reveal>
      </Container>
    </section>
  );
}
