import type { Metadata } from "next";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "About Modempic",
  description: "Our mission: accessible, affordable wellness products with honest labeling.",
};

export default function AboutPage() {
  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About Modempic</h1>
      <div className="prose-custom mt-8 max-w-2xl space-y-4 text-[var(--muted-foreground)]">
        <p>
          We believe dietary supplements should be easy to understand and fairly priced. Too many brands bury the
          details behind marketing language or hide true cost behind subscriptions you did not ask for.
        </p>
        <p>
          Modempic is built around clear supplement facts, structure/function language that stays within regulations, and
          checkout options that meet you where you are—including digital assets and card on-ramps from vetted partners.
        </p>
        <p>
          We are not a substitute for your doctor or pharmacist. We sell wellness products, not prescriptions, and we
          do not claim to treat diseases. If you have a medical condition or take medication, get professional advice
          before starting a new supplement.
        </p>
      </div>
    </Container>
  );
}
