import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/home/reveal";
import type { HeroContent } from "@/types";

/**
 * TODO(cursor): replace with Sanity "hero" singleton document.
 * Copy preserved verbatim from the current storefront.
 */
const heroContent: HeroContent = {
  kicker: "MODEMPIC | BEST PRICES GUARANTEED",
  headlineLines: ["Medicine shouldn't", "be a privilege."],
  subcopy:
    "We carry the medicines that are hard to find, and we keep the price where it belongs — affordable for everyone.",
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
      <Container className="relative grid gap-12 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-16 lg:py-32">
        <Reveal className="@container max-w-2xl">
          <Badge>{heroContent.kicker}</Badge>
          <h1
            id="hero-heading"
            className="mt-4 flex flex-col gap-0.5 text-[clamp(1.75rem,8vw,4.5rem)] font-semibold leading-[1.1] tracking-tight text-foreground sm:gap-1"
          >
            {heroContent.headlineLines.map((line, i) => (
              <span key={i} className={i === heroContent.headlineLines.length - 1 ? "sm:whitespace-nowrap" : undefined}>
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-xl">
            {heroContent.subcopy}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href={heroContent.primaryCta.href}>{heroContent.primaryCta.label}</Link>
            </Button>
            {heroContent.secondaryCta ? (
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href={heroContent.secondaryCta.href}>{heroContent.secondaryCta.label}</Link>
              </Button>
            ) : null}
          </div>
        </Reveal>

        <Reveal delay={0.12} className="hidden lg:block">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-border bg-muted shadow-[var(--shadow-card)]">
            <Image
              src="/hero-vial.png"
              alt="Pharmaceutical-grade vial on a clinical white surface"
              fill
              priority
              sizes="(min-width: 1024px) 26rem, 0px"
              className="object-cover"
            />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
