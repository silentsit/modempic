import { Container } from "@/components/site/container";
import Link from "next/link";
import { Bitcoin, CreditCard } from "lucide-react";

export function PaymentExplainerSection() {
  return (
    <section className="border-b border-[var(--border)] py-16 sm:py-20" aria-labelledby="payment-heading">
      <Container>
        <h2 id="payment-heading" className="text-2xl font-semibold sm:text-3xl">
          How you pay
        </h2>
        <p className="mt-2 max-w-3xl text-[var(--muted-foreground)]">
          We keep checkout simple. You can pay with the option that works best for you. Identity verification, limits, and
          availability depend on the payment provider, your location, the transaction, and their risk and compliance
          rules—there is <strong>no</strong> universal &ldquo;no verification&rdquo; guarantee. Read our{" "}
          <Link href="/terms" className="text-[var(--primary)] underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[var(--primary)] underline">
            privacy policy
          </Link>{" "}
          for how we use order data.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex items-center gap-2 text-[var(--primary)]">
              <Bitcoin className="h-6 w-6" aria-hidden />
              <h3 className="text-lg font-semibold">Cryptocurrency (default)</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              Checkout uses <strong>Paymento</strong> to accept crypto: you complete payment on their hosted page and
              funds are sent to our configured wallet. Select from supported digital assets in the flow. Network fees and
              confirmation times are set by the network, not Modempic.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
              If you do not already hold crypto, you can use the <strong>card on-ramp</strong> path instead, which
              routes you to a partner that may help you buy crypto with a card—subject to that partner&rsquo;s rules
              (this is separate from our direct-to-wallet Paymento link).
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex items-center gap-2 text-[var(--primary)]">
              <CreditCard className="h-6 w-6" aria-hidden />
              <h3 className="text-lg font-semibold">Card purchase / on-ramp</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              You may be routed to a licensed partner&rsquo;s on-ramp or card flow. That partner sets verification and
              limits. Modempic does not store your full card number; we only receive the status needed to mark your
              order paid.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
