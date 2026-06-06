import { Container } from "@/components/site/container";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AboutBlurbSection() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="about-short-heading">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="about-short-heading" className="text-2xl font-semibold sm:text-3xl">
            Who We Are
          </h2>
          <p className="mt-4 text-[var(--muted-foreground)]">
            Modempic is built around clear catalog records, transparent pricing, and careful product documentation.
            We keep ordering straightforward while making product labels, handling notes, and checkout options easy to
            review before purchase.
          </p>
          <p className="mt-4 text-[var(--muted-foreground)]">
            Built by seasoned operators and industry experts from Sharkmood, Modafico, and Noofox, our team brings a
            wealth of operational experience to the table. We know what it takes to maintain catalog accuracy, reliable
            fulfillment workflows, and responsive support for a specialized ecommerce store.
          </p>
          <Button variant="outline" className="mt-8" asChild>
            <Link href="/about">Read our story</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
