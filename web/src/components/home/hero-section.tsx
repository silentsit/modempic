import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/site/container";
import { HeroBottles } from "@/components/home/hero-bottles";
import { HERO_CUTOUTS } from "@/lib/catalog/hero-showcase";
import { titleCaseHeading } from "@/lib/text/heading-title-case";
import type { HeroContent } from "@/types";

/**
 * TODO(cursor): replace with Sanity "hero" singleton document.
 * Copy preserved verbatim from the current storefront.
 */
const heroContent: HeroContent = {
  kicker: "Modafinil Made Affordable",
  headlineLines: ["Buy Modafinil Reddit:", "What People Are Actually Searching For"],
  subcopy:
    "People searching this phrase are often trying to figure out several things at once: what modafinil is like, what other users report, what’s legitimate, what’s risky, and whether Reddit is a sensible place to get answers in the first place.",
  primaryCta: { label: "Shop all", href: "/shop" },
  secondaryCta: { label: "View best sellers", href: "/shop/best-sellers" },
};

export function HeroSection() {
  return (
    <section
      className="relative overflow-x-clip border-b border-border bg-background"
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
      <Container className="relative py-16 sm:py-24 lg:py-[100px]">
        <div className="@container max-w-2xl lg:max-w-[34rem]">
          <Badge>{heroContent.kicker}</Badge>
          <h1
            id="hero-heading"
            className="mt-4 flex flex-col gap-0.5 font-sans text-[clamp(1.5rem,5.5vw,2.75rem)] font-bold leading-[1.15] tracking-tight text-foreground sm:gap-1"
          >
            {heroContent.headlineLines.map((line, i) => (
              <span key={i}>
                {titleCaseHeading(line)}
              </span>
            ))}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {heroContent.subcopy}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href={heroContent.primaryCta.href}>{heroContent.primaryCta.label}</Link>
            </Button>
            {heroContent.secondaryCta ? (
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href={heroContent.secondaryCta.href}>{heroContent.secondaryCta.label}</Link>
              </Button>
            ) : null}
          </div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Shopping for Modafinil listings?{" "}
            <Link
              href="/where-to-buy-modafinil-online"
              className="font-medium text-accent underline-offset-2 transition-colors hover:text-accent-hover hover:underline"
            >
              Where to buy Modafinil online
            </Link>{" "}
            covers pack prices, shipping, and checkout in one place.
          </p>
        </div>

        <HeroBottles products={[...HERO_CUTOUTS]} />
      </Container>
    </section>
  );
}
