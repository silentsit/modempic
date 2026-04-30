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
        <div className="@container max-w-2xl">
          <p className="text-sm font-medium tracking-widest text-white/80">
            COGNITIVE PERFORMANCE &amp; LIFESTYLE WELLNESS
          </p>
          <h1
            id="hero-heading"
            className="mt-3 flex flex-col gap-0.5 font-bold leading-[1.15] tracking-tight sm:gap-1"
            style={{
              fontSize: "min(4.5rem, max(0.8125rem, calc(100cqw / 15.2)))",
            }}
          >
            <span>No games.</span>
            <span>No dishonesty.</span>
            <span className="whitespace-nowrap">We don&apos;t like wasting time.</span>
          </h1>
          <p className="mt-5 text-lg text-white/90 sm:text-xl">
            Modafinil, Ivermectin, Retatrutide and other supplements and medicines for cognitive enhancement,
            alternative treatments, and overall wellness.
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
