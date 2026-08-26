import Link from "next/link";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/home/reveal";

export function AboutBlurbSection() {
  return (
    <section className="bg-background py-16 sm:py-20" aria-labelledby="about-short-heading">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 id="about-short-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            About Modempic
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            We started Modempic because the medicines people actually need are too often the hardest to find and the
            most overpriced. Somewhere between the manufacturer and the person who needs the order, the price stopped
            making sense — so we exist to cut that distance down.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            The team behind Fox Dose and Noofox built this shop. Prices are in USD by pack size. Card checkout by
            default, crypto if you want it.
          </p>
          <p className="mt-6">
            <Link
              href="/about"
              className="font-medium text-accent underline-offset-2 transition-colors hover:text-accent-hover hover:underline"
            >
              Read more about Modempic
            </Link>
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
