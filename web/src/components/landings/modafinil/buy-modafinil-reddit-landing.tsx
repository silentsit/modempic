import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPackTierSaveCompact, formatUsdTierLine } from "@/lib/product-variants";
import { titleCaseHeading } from "@/lib/text/heading-title-case";
import {
  PRICE_INDEX_CSV_PATH,
  PRICE_INDEX_EDITION,
  PRICE_INDEX_PATH,
  formatPriceIndexDate,
} from "@/lib/compare/price-index";
import type { HydratedPricingRow } from "@/lib/landings/hydrate-modafinil-pricing";
import type {
  BuyModafinilRedditCopy,
  RedditLandingQuestion,
} from "@/content/landings/buy-modafinil-reddit";

const SECTION_SCROLL = "scroll-mt-[var(--site-sticky-offset)]";
const ACCENT_LINK = "font-medium text-accent underline-offset-2 hover:text-accent-hover hover:underline";

function QuestionBlock({
  item,
  Heading,
}: {
  item: RedditLandingQuestion;
  Heading: "h2" | "h3";
}) {
  const headingClass =
    Heading === "h2"
      ? "text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      : "text-xl font-semibold tracking-tight text-foreground";

  return (
    <article>
      <Heading className={headingClass}>{titleCaseHeading(item.q)}</Heading>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{item.a}</p>
      {item.links?.length ? (
        <ul className="mt-3 space-y-1.5 text-sm">
          {item.links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={ACCENT_LINK}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {item.sources?.length ? (
        <ul className="mt-3 space-y-1.5 text-sm">
          {item.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer" className={ACCENT_LINK}>
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export function BuyModafinilRedditLanding({
  copy,
  pricingRows,
}: {
  copy: BuyModafinilRedditCopy;
  pricingRows: HydratedPricingRow[];
}) {
  const indexPulledOn = formatPriceIndexDate(PRICE_INDEX_EDITION.pulledOn);

  return (
    <div>
      <Container className="pt-6">
        <Breadcrumbs
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Buy Modafinil Reddit" },
          ]}
        />
      </Container>

      <section className="relative mt-6 overflow-hidden bg-primary text-primary-foreground" aria-labelledby="reddit-hero-heading">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 80% -10%, rgba(255,255,255,0.18), transparent), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(0,0,0,0.12), transparent)",
          }}
          aria-hidden
        />
        <Container className="relative py-14 sm:py-20">
          <Badge className="bg-white/15 text-white">{copy.hero.kicker}</Badge>
          <h1
            id="reddit-hero-heading"
            className="mt-4 max-w-4xl text-[clamp(1.75rem,5vw,3.25rem)] font-bold leading-[1.12] tracking-tight"
          >
            {titleCaseHeading(copy.hero.headline)}
          </h1>
          <div className="mt-5 max-w-2xl space-y-4 text-sm leading-relaxed text-white/90 sm:text-base">
            {copy.hero.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto" asChild>
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

      <section id="checklist" className={`${SECTION_SCROLL} py-14 sm:py-16`} aria-labelledby="checklist-heading">
        <Container>
          <h2 id="checklist-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {titleCaseHeading(copy.checklist.heading)}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{copy.checklist.intro}</p>
          <ol className="mt-10 max-w-3xl list-none space-y-8 p-0">
            {copy.checklist.items.map((item, index) => (
              <li key={item.href} className="flex gap-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold tracking-tight text-foreground">{titleCaseHeading(item.title)}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-base">{item.body}</p>
                  <Link href={item.href} className={`mt-2 inline-block text-sm ${ACCENT_LINK}`}>
                    {item.linkLabel}
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section
        id="packs"
        className={`${SECTION_SCROLL} bg-section-tint-primary py-14 sm:py-16`}
        aria-labelledby="reddit-packs-heading"
      >
        <Container>
          <h2 id="reddit-packs-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {titleCaseHeading(copy.pricing.heading)}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{copy.pricing.intro}</p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            The same four listings sit on the {PRICE_INDEX_EDITION.quarter} pack index (pulled {indexPulledOn}) with a{" "}
            <Link href={PRICE_INDEX_CSV_PATH} className={ACCENT_LINK}>
              downloadable CSV
            </Link>
            . Open the{" "}
            <Link href={PRICE_INDEX_PATH} className={ACCENT_LINK}>
              Modafinil price comparison
            </Link>{" "}
            for the dated table.
          </p>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {pricingRows.map((row) => (
              <li key={row.productSlug} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  {row.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- catalog URLs mix Cloudinary and local
                    <img
                      src={row.imageUrl}
                      alt={row.imageAlt || `${row.name} ${row.strength}`.trim()}
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
                      {pack.save ? (
                        <p className="mt-0.5 text-[11px] font-medium text-primary">
                          {formatPackTierSaveCompact(pack.save)}
                        </p>
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
        </Container>
      </section>

      <section id="answers" className={`${SECTION_SCROLL} py-14 sm:py-16`} aria-label="Sourcing questions">
        <Container>
          <div className="max-w-3xl space-y-12">
            {copy.featuredQuestions.map((item) => (
              <QuestionBlock key={item.q} item={item} Heading="h2" />
            ))}
          </div>
          <h2 className="mt-14 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {titleCaseHeading("More sourcing questions")}
          </h2>
          <div className="mt-10 max-w-3xl space-y-10">
            {copy.moreQuestions.map((item) => (
              <QuestionBlock key={item.q} item={item} Heading="h3" />
            ))}
          </div>
        </Container>
      </section>

      <section
        id="reviews"
        className={`${SECTION_SCROLL} bg-section-tint-primary py-14 sm:py-16`}
        aria-labelledby="reviews-teaser-heading"
      >
        <Container>
          <h2 id="reviews-teaser-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {titleCaseHeading(copy.reviews.heading)}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{copy.reviews.body}</p>
          <Button className="mt-6" asChild>
            <Link href={copy.reviews.href}>{copy.reviews.cta}</Link>
          </Button>
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
