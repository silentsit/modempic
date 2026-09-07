import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import {
  SHIPPING_COUNTRIES,
  shippingCountryBySlug,
  shippingCountryTitle,
} from "@/content/shipping/country-pages";
import { loadCompareProducts } from "@/lib/data/compare";
import { costPer200mgCents, tiersForCompare } from "@/lib/compare/cost-per-dose";
import { formatUsd } from "@/lib/domain/money";
import { DEFAULT_SHARE_IMAGE, MISSING_ENTITY_METADATA, pageDocumentTitle, pageShareTitle } from "@/lib/seo/page-metadata";
import { buildWebPageJsonLd } from "@/lib/seo/page-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { titleCaseHeading } from "@/lib/text/heading-title-case";

export const revalidate = 3600;

type Props = { params: Promise<{ country: string }> };

export function generateStaticParams() {
  return SHIPPING_COUNTRIES.map((country) => ({ country: country.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: slug } = await params;
  const country = shippingCountryBySlug(slug);
  if (!country) return { title: "Shipping", ...MISSING_ENTITY_METADATA };
  const title = shippingCountryTitle(country);
  const description = `${title}: ${country.transitLabel}, tracking notes, payment methods, and cited legal status.`;
  return {
    title: pageDocumentTitle(title),
    description,
    alternates: { canonical: `/shipping/${country.slug}` },
    openGraph: {
      title: pageShareTitle(title),
      description,
      url: `/shipping/${country.slug}`,
      type: "website",
      images: [DEFAULT_SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: pageShareTitle(title),
      description,
      images: [DEFAULT_SHARE_IMAGE.url],
    },
  };
}

export default async function ShippingCountryPage({ params }: Props) {
  const { country: slug } = await params;
  const country = shippingCountryBySlug(slug);
  if (!country) notFound();

  const title = shippingCountryTitle(country);
  const products = await loadCompareProducts();
  const priced = products
    .map((product) => {
      const tiers = tiersForCompare(product);
      const lowest = tiers.length ? Math.min(...tiers.map((tier) => tier.priceCents)) : product.priceCents;
      return {
        slug: product.slug,
        name: product.name,
        lowest,
        per200: costPer200mgCents(tiers, product.strengthMg),
      };
    })
    .sort((a, b) => a.lowest - b.lowest)
    .slice(0, 6);

  const site = getSiteUrl();
  const description = `${title}: ${country.transitLabel}, tracking notes, payment methods, and cited legal status.`;

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Shipping", href: "/shipping" },
          { label: country.countryName.replace(/^the /, "") },
        ]}
      />
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{titleCaseHeading(title)}</h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
        {title} is listed here because Modempic ships worldwide and this destination has a cited regulator note plus a
        known transit band. Typical delivery is {country.transitLabel}. Duties, taxes, and import rules stay with the
        recipient.
      </p>

      <section className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">Transit and tracking</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Orders are processed within 12 hours of payment confirmation. Shipping is free express mail. The estimate for{" "}
          {country.countryName} is {country.transitLabel}. Weather, carrier volume, holidays, and customs can add time.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          {country.trackingNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
          <li>
            If tracking shows the parcel stuck at customs for 14 days, email support with the order number. The first
            step is a reship at no extra charge. See the{" "}
            <Link href="/refund-policy" className="text-accent underline-offset-2 hover:underline">
              return policy
            </Link>
            .
          </li>
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">Legal status in {country.countryName.replace(/^the /, "")}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{country.legalStatus}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {country.legalSources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                className="text-accent underline-offset-2 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">Payment</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{country.paymentNotes}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Checkout details are on{" "}
          <Link href="/how-to-pay" className="text-accent underline-offset-2 hover:underline">
            How to pay
          </Link>
          .
        </p>
      </section>

      {priced.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">Live catalog prices</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Lowest published pack total on each listing. Open the product page for the matching checkout amount.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {priced.map((product) => (
              <li key={product.slug} className="flex justify-between gap-4 border-b border-border/70 py-2">
                <Link href={`/product/${product.slug}`} className="text-accent underline-offset-2 hover:underline">
                  {product.name}
                </Link>
                <span className="tabular-nums">{formatUsd(product.lowest)}</span>
              </li>
            ))}
          </ul>
          <Button className="mt-6" asChild>
            <Link href="/modafinil-price-comparison">Open the full price table</Link>
          </Button>
        </section>
      ) : null}

      <RelatedLinks
        heading="Related"
        links={[
          { href: "/shipping", label: "Shipping & handling", description: "Worldwide transit bands and tracking suffixes." },
          { href: "/modafinil-price-comparison", label: "Modafinil price comparison" },
          { href: "/how-to-pay", label: "How to pay" },
          { href: "/shop/nootropics", label: "Nootropics catalog" },
        ]}
      />
      <JsonLd
        data={buildWebPageJsonLd({
          name: title,
          description,
          path: `/shipping/${country.slug}`,
          baseUrl: site,
        })}
      />
    </Container>
  );
}
