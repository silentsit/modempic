import { Container } from "@/components/site/container";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AboutBlurbSection() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="about-short-heading">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="about-short-heading" className="text-2xl font-semibold sm:text-3xl">
            Medicine Made Accessible
          </h2>
          <p className="mt-4 text-[var(--muted-foreground)]">
            Modempic was founded on a simple belief: everyone should have access to safe, affordable medicines with
            transparent prices. We bridge the gap between you and medicines that are too often put out of reach by
            complex barriers or unfair pricing. No one should ever have to suffer because they can&apos;t afford basic
            medications.
          </p>
          <p className="mt-4 text-[var(--muted-foreground)]">
            Built by seasoned operators and industry experts from Sharkmood, Modafico, and Noofox, our team brings a
            wealth of proven experience to the table. We know what it takes to deliver excellence, and we are building a
            reliable platform you can trust for the long haul. We&apos;re here to stay, and we&apos;re here for you.
          </p>
          <Button variant="outline" className="mt-8" asChild>
            <Link href="/about">Read our story</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
