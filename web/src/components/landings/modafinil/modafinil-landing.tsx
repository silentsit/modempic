import Link from "next/link";
import { CreditCard, Mail, MapPin, Package, Truck, Wallet } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LandingFaqAccordion } from "@/components/landings/modafinil/landing-faq-accordion";
import { LandingSectionNav } from "@/components/landings/modafinil/landing-section-nav";
import { formatUsdTierLine } from "@/lib/product-variants";
import { titleCaseHeading } from "@/lib/text/heading-title-case";
import type { HydratedPricingRow } from "@/lib/landings/hydrate-modafinil-pricing";
import type { ModafinilLandingCopy } from "@/content/landings/where-to-buy-modafinil-online";

const SECTION_SCROLL = "scroll-mt-[calc(var(--site-sticky-offset)+3.75rem)]";

const TRUST_ICONS = [Truck, MapPin, Package, CreditCard, Wallet, Mail] as const;

const ORDER_STEPS = [
  {
    title: "Open a listing",
    body: "Start with Modalert 200 mg or Modvigil 200 mg, or browse the full nootropics catalog.",
  },
  {
    title: "Pick a pack",
    body: "Choose 30, 50, or 100 pills on the product page. Live USD totals and per-pill save sit on that page.",
  },
  {
    title: "Check out",
    body: "Card is the default. Crypto is optional. We email tracking after dispatch, within 12 hours of payment confirmation.",
  },
] as const;

export function ModafinilLanding({
  copy,
  pricingRows,
}: {
  copy: ModafinilLandingCopy;
  pricingRows: HydratedPricingRow[];
}) {
  return (
    <div className="scroll-smooth">
      <LandingSectionNav shopHref={copy.hero.primaryCta.href} shopLabel={copy.hero.primaryCta.label} />

      <Container className="pt-6">
        <Breadcrumbs
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Where to Buy Modafinil Online" },
          ]}
        />
      </Container>

      <section className="relative mt-6 overflow-hidden bg-primary text-primary-foreground" aria-labelledby="landing-hero-heading">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 80% -10%, rgba(255,255,255,0.18), transparent), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(0,0,0,0.12), transparent)",
          }}
          aria-hidden
        />
        <Container className="relative py-14 sm:py-20">
          <Badge className="bg-white/15 text-white">Buy online</Badge>
          <h1
            id="landing-hero-heading"
            className="mt-4 max-w-4xl text-[clamp(1.75rem,5vw,3.25rem)] font-bold leading-[1.12] tracking-tight"
          >
            {titleCaseHeading(copy.hero.headline)}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">{copy.hero.subhead}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto"
              asChild
            >
              <Link href={copy.hero.primaryCta.href}>{copy.hero.primaryCta.label}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white sm:w-auto"
              asChild
            >
              <Link href={copy.hero.secondaryCta.href}>{copy.hero.secondaryCta.label}</Link>
            </Button>
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-foreground text-background" aria-label="Order guarantees">
        <Container className="py-5">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {copy.trustBadges.map((badge, index) => {
              const Icon = TRUST_ICONS[index] ?? Mail;
              return (
                <li key={badge.label} className="flex gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{badge.label}</p>
                    <p className="mt-0.5 text-sm text-white/75">{badge.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      <section className="bg-section-tint-neutral py-14 sm:py-16" aria-labelledby="benefits-heading">
        <Container>
          <h2 id="benefits-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {titleCaseHeading("Why shoppers start here")}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {copy.benefits.map((benefit) => (
              <article key={benefit.title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--card-shadow-value)]">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {titleCaseHeading(benefit.title)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{benefit.body}</p>
                {benefit.href ? (
                  <Link
                    href={benefit.href}
                    className="mt-4 inline-flex text-sm font-medium text-accent underline-offset-2 hover:text-accent-hover hover:underline"
                  >
                    See details
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="how-to-order" className={`${SECTION_SCROLL} py-14 sm:py-16`} aria-labelledby="how-to-order-heading">
        <Container>
          <h2 id="how-to-order-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {titleCaseHeading("How to buy Modafinil online")}
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {ORDER_STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{titleCaseHeading(step.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section
        id="packs"
        className={`${SECTION_SCROLL} bg-section-tint-primary py-14 sm:py-16`}
        aria-labelledby="packs-heading"
      >
        <Container>
          <h2 id="packs-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {titleCaseHeading(copy.pricing.heading)}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{copy.pricing.intro}</p>

          <div className="mt-8 hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/80 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  {copy.pricing.rows[0]?.packs.map((pack) => (
                    <th key={pack} className="px-5 py-3 font-semibold">
                      {pack}
                    </th>
                  ))}
                  <th className="px-5 py-3 font-semibold">
                    <span className="sr-only">Shop</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pricingRows.map((row) => (
                  <tr key={row.productSlug} className="align-middle">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {row.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- catalog URLs mix Cloudinary and local
                          <img
                            src={row.imageUrl}
                            alt={row.imageAlt}
                            width={56}
                            height={56}
                            className="h-14 w-14 rounded-xl border border-border bg-background object-contain p-1"
                          />
                        ) : null}
                        <div>
                          <p className="font-semibold text-foreground">
                            {row.name} {row.strength}
                          </p>
                          <p className="text-xs text-muted-foreground">USD at checkout</p>
                        </div>
                      </div>
                    </td>
                    {row.packs.map((pack) => (
                      <td key={pack.label} className="px-5 py-4 tabular-nums">
                        {pack.priceCents != null ? (
                          <div>
                            <p className="font-semibold text-foreground">{formatUsdTierLine(pack.priceCents)}</p>
                            {pack.savePercent != null ? (
                              <p className="text-xs font-medium text-primary">Save {pack.savePercent}% / pill</p>
                            ) : (
                              <p className="text-xs text-muted-foreground">Base pack</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">See product page</span>
                        )}
                      </td>
                    ))}
                    <td className="px-5 py-4">
                      <Button size="sm" asChild>
                        <Link href={row.href}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-8 grid gap-4 md:hidden">
            {pricingRows.map((row) => (
              <li key={row.productSlug} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  {row.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- catalog URLs mix Cloudinary and local
                    <img
                      src={row.imageUrl}
                      alt={row.imageAlt}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-xl border border-border bg-background object-contain p-1"
                    />
                  ) : null}
                  <div>
                    <p className="font-semibold text-foreground">
                      {row.name} {row.strength}
                    </p>
                    <p className="text-xs text-muted-foreground">Live USD pack prices</p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {row.packs.map((pack) => (
                    <div key={pack.label} className="rounded-xl bg-muted px-2 py-3">
                      <dt className="text-[11px] font-medium text-muted-foreground">{pack.label}</dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                        {pack.priceCents != null ? formatUsdTierLine(pack.priceCents) : "—"}
                      </dd>
                      {pack.savePercent != null ? (
                        <p className="mt-0.5 text-[11px] font-medium text-primary">−{pack.savePercent}%</p>
                      ) : null}
                    </div>
                  ))}
                </dl>
                <Button className="mt-4 w-full" asChild>
                  <Link href={row.href}>Open product</Link>
                </Button>
              </li>
            ))}
          </ul>

          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{copy.pricing.footnote}</p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href={copy.pricing.catalogCta.href}>{copy.pricing.catalogCta.label}</Link>
          </Button>
        </Container>
      </section>

      <section id="overview" className={`${SECTION_SCROLL} py-14 sm:py-16`} aria-labelledby="overview-heading">
        <Container>
          <div className="max-w-3xl">
            <h2 id="overview-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {titleCaseHeading(copy.overview.heading)}
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.overview.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
            <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.12em] text-foreground">Sources</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {copy.overview.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent underline-offset-2 hover:text-accent-hover hover:underline"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section
        id="faq"
        className={`${SECTION_SCROLL} bg-section-tint-accent py-14 sm:py-16`}
        aria-labelledby="faq-heading"
      >
        <Container>
          <h2 id="faq-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {titleCaseHeading("Questions before you order")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Legal status varies by country. Clinical lines below cite FDA, NIH, or Mayo Clinic pages — not forum posts.
          </p>
          <div className="mt-8 max-w-3xl">
            <LandingFaqAccordion faqs={copy.faqs} />
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-16" aria-label="Related pages">
        <Container>
          <RelatedLinks heading="Related on Modempic" links={copy.internalLinks} className="mt-0" />
          <p className="mt-10 max-w-3xl rounded-2xl border border-border bg-muted px-5 py-4 text-sm leading-relaxed text-muted-foreground">
            {copy.disclaimer}
          </p>
        </Container>
      </section>
    </div>
  );
}
