import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/home/reveal";
import { HeroBottles } from "@/components/home/hero-bottles";
import { getHeroShowcaseProducts } from "@/lib/data/products";
import type { HeroContent } from "@/types";

/**
 * TODO(cursor): replace with Sanity "hero" singleton document.
 * Copy preserved verbatim from the current storefront.
 */
const heroContent: HeroContent = {
  kicker: "HARD TO FIND. FAIRLY PRICED.",
  headlineLines: ["Medicine shouldn't", "be a privilege."],
  subcopy:
    "We carry the medicines that are hard to find, and we keep the price where it belongs — affordable for everyone.",
  primaryCta: { label: "Shop all", href: "/shop" },
  secondaryCta: { label: "View best sellers", href: "/shop/best-sellers" },
};

export async function HeroSection() {
  const catalog = await getHeroShowcaseProducts();
  const showcase = catalog.flatMap((product) => {
    const image = product.images.find((img) => img.url);
    if (!image?.url) return [];
    return [
      {
        slug: product.slug,
        name: product.name,
        imageUrl: image.url,
      },
    ];
  });

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
      <Container className="relative grid gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,32rem)] lg:items-end lg:gap-12 lg:py-28">
        <Reveal className="@container max-w-2xl pb-4 lg:pb-8">
          <Badge>{heroContent.kicker}</Badge>
          <h1
            id="hero-heading"
            className="mt-4 flex flex-col gap-0.5 text-[clamp(1.5rem,5.5vw,2.75rem)] font-semibold leading-[1.15] tracking-tight text-foreground sm:gap-1"
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

        {showcase.length > 0 ? <HeroBottles products={showcase} /> : null}
      </Container>
    </section>
  );
}
