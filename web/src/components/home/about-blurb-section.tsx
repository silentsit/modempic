import { Container } from "@/components/site/container";
import { Reveal } from "@/components/home/reveal";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AboutBlurbSection() {
  return (
    <section className="bg-background py-16 sm:py-20" aria-labelledby="about-short-heading">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 id="about-short-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Who We Are
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            We believe the price of staying well should not depend on where you live or what you earn. Modempic exists
            to close that gap: medicines that are hard to find, priced below other online vendors, one affordable order
            at a time.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Built by operators from Sharkmood, Modafico, and Noofox. Clear labels, pack-size pricing, and straightforward
            checkout — because access only counts if people can actually afford it.
          </p>
          <Button variant="outline" className="mt-8" asChild>
            <Link href="/about">Read our story</Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
