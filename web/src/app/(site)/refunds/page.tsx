import type { Metadata } from "next";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "Refunds & returns",
};

export default function RefundsPage() {
  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Refunds and returns</h1>
      <div className="prose-custom mt-8 max-w-2xl space-y-4 text-sm text-[var(--muted-foreground)]">
        <p>
          Opened dietary supplements may not be eligible for return for safety and quality reasons. If your order
          arrived damaged, incorrect, or is missing, contact support@modempic.com within 30 days of delivery with
          your order number and photos when relevant.
        </p>
        <p>
          Refunds, when approved, are issued to the original payment method when possible. Crypto refunds follow the
          same policy in USD equivalent and may be processed as store credit or via the original rail depending on
          compliance and network constraints.
        </p>
        <p>Chargebacks and abuse may result in account closure. We aim to resolve issues fairly and quickly.</p>
      </div>
    </Container>
  );
}
