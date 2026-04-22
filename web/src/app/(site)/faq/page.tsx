import type { Metadata } from "next";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "FAQ",
};

const items = [
  {
    q: "Do you ship internationally?",
    a: "We currently sell in USD and ship within the United States. Expandable later as we scale operations.",
  },
  {
    q: "Are your products FDA approved?",
    a: "Dietary supplements are regulated differently from drugs. Our products are manufactured in line with applicable supplement rules; specific structure/function statements appear on each product page with the required disclaimer.",
  },
  {
    q: "How does crypto checkout work?",
    a: "At checkout you can select a supported digital asset. You will see pay-in instructions and a time window. Network fees and confirmation times depend on the blockchain, not Modempic.",
  },
  {
    q: "Can I check out as a guest?",
    a: "No. You need an account so we can tie your order to email and payment status. Registration is quick and you can sign in with Google when enabled.",
  },
];

export default function FaqPage() {
  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">FAQ</h1>
      <dl className="mt-10 max-w-2xl space-y-8">
        {items.map((item) => (
          <div key={item.q}>
            <dt className="text-lg font-semibold text-[var(--foreground)]">{item.q}</dt>
            <dd className="mt-2 text-[var(--muted-foreground)]">{item.a}</dd>
          </div>
        ))}
      </dl>
    </Container>
  );
}
