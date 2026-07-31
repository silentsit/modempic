import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/site/container";
import type { HeroContent } from "@/types";

/**
 * TODO(cursor): replace with Sanity "hero" singleton document.
 * Copy preserved verbatim from the current storefront.
 */
const heroContent: HeroContent = {
  kicker: "MODEMPIC | CLEAR CATALOG AND SECURE CHECKOUT",
  headlineLines: ["No games.", "No dishonesty.", "We don't like wasting time."],
  subcopy:
    "Clear product records, pack-size pricing, tracked order updates, and crypto-first checkout without the usual runaround.",
  primaryCta: { label: "Shop all", href: "/shop" },
  secondaryCta: { label: "View best sellers", href: "/shop/best-sellers" },
};

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden border-b border-border bg-background"
      aria-labelledby="hero-heading"
    >
      {/* Quiet clinical tint — replaces the dark radial overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -20%, rgba(45,106,79,0.06), transparent)",
        }}
        aria-hidden
      />
      <Container className="relative py-20 sm:py-28 lg:py-32">
        <div className="@container max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {heroContent.kicker}
          </p>
          <h1
            id="hero-heading"
            className="mt-4 flex flex-col gap-0.5 font-semibold leading-[1.1] tracking-tight text-foreground sm:gap-1"
            style={{
              fontSize: "min(4.5rem, max(0.8125rem, calc(100cqw / 15.2)))",
            }}
          >
            {heroContent.headlineLines.map((line, i) => (
              <span key={i} className={i === heroContent.headlineLines.length - 1 ? "whitespace-nowrap" : undefined}>
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {heroContent.subcopy}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild>
              <Link href={heroContent.primaryCta.href}>{heroContent.primaryCta.label}</Link>
            </Button>
            {heroContent.secondaryCta ? (
              <Button size="lg" variant="outline" asChild>
                <Link href={heroContent.secondaryCta.href}>{heroContent.secondaryCta.label}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
