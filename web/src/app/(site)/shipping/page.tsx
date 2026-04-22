import type { Metadata } from "next";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "Shipping policy",
};

export default function ShippingPage() {
  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Shipping policy</h1>
      <div className="prose-custom mt-8 max-w-2xl space-y-4 text-sm text-[var(--muted-foreground)]">
        <p>
          Orders ship after payment is confirmed. You will received tracking by email for eligible carriers. Carriers
          and delivery windows are selected at checkout when applicable.
        </p>
        <p>
          Shipping costs, if any, are shown in USD before you pay. We do not control carrier delays, weather, or
          address errors entered at checkout.
        </p>
      </div>
    </Container>
  );
}
