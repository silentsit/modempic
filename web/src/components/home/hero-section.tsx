import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/site/container";

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--hero)] text-[var(--hero-foreground)]"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.2), transparent), linear-gradient(180deg, rgba(0,0,0,0.2), transparent)",
        }}
      />
      <Container className="relative py-20 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-white/80">Modempic wellness</p>
          <h1 id="hero-heading" className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Wellness that fits real life
          </h1>
          <p className="mt-5 text-lg text-white/90 sm:text-xl">
            Supplements, vitamins, and herbs with clear labels and fair prices—so you can feel confident about what
            you&apos;re buying.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" className="bg-white text-[var(--hero)] hover:bg-white/90" asChild>
              <Link href="/shop">Shop all</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/50 bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link href="/shop/best-sellers">View best sellers</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
