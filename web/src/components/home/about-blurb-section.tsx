import { Container } from "@/components/site/container";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AboutBlurbSection() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="about-short-heading">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="about-short-heading" className="text-2xl font-semibold sm:text-3xl">
            Built for real budgets
          </h2>
          <p className="mt-4 text-[var(--muted-foreground)]">
            Modempic exists to make high-quality supplement shopping easier to access. We invest in clear product pages,
            honest structure/function copy, and pricing that does not play games—because wellness support should be
            within reach for more households.
          </p>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            *Not intended to diagnose, treat, cure, or prevent any disease. If you are pregnant, nursing, or on
            medication, ask a health professional before use.
          </p>
          <Button variant="outline" className="mt-8" asChild>
            <Link href="/about">Read our story</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
