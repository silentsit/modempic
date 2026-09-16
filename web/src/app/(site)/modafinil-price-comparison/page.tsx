import type { Metadata } from "next";
import Link from "next/link";
import { CopyPriceIndexButton } from "@/components/compare/copy-price-index-button";
import { PriceComparisonTable } from "@/components/compare/price-comparison-table";
import { PriceIndexTable } from "@/components/compare/price-index-table";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { comparePairDisplayLabel } from "@/lib/compare/compare-keys";
import {
  PRICE_INDEX_CSV_PATH,
  PRICE_INDEX_EDITION,
  formatPriceIndexDate,
  isModafinilCatalogRow,
  priceIndexTsv,
} from "@/lib/compare/price-index";
import { getIndexableComparePairs, loadCompareProducts } from "@/lib/data/compare";
import { costPer200mgCents, costPerTabletCents, packQuantityFromLabel, tiersForCompare } from "@/lib/compare/cost-per-dose";
import { formatUsd } from "@/lib/domain/money";
import { DEFAULT_SHARE_IMAGE, pageDocumentTitle, pageShareTitle } from "@/lib/seo/page-metadata";
import { buildItemListJsonLd } from "@/lib/seo/listing-json-ld";
import { buildWebPageJsonLd } from "@/lib/seo/page-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { titleCaseHeading } from "@/lib/text/heading-title-case";

export const revalidate = 3600;

const TITLE = "Modafinil price comparison";
const DESCRIPTION =
  "Modafinil price comparison of four Modempic packs as of 15 Sep 2026: Modvigil, Artvigil, Modalert, Waklert 30/60/90 USD. Method and CSV on the page.";

export const metadata: Metadata = {
  title: pageDocumentTitle(TITLE),
  description: DESCRIPTION,
  alternates: { canonical: "/modafinil-price-comparison" },
  openGraph: {
    title: pageShareTitle(TITLE),
    description: DESCRIPTION,
    url: "/modafinil-price-comparison",
    type: "website",
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: pageShareTitle(TITLE),
    description: DESCRIPTION,
    images: [DEFAULT_SHARE_IMAGE.url],
  },
};

const DEFAULT_PACKS = ["30 pills", "60 pills", "90 pills"] as const;

function packPrice(tiers: ReturnType<typeof tiersForCompare>, label: string): number | null {
  const wanted = label.toLowerCase();
  const match = tiers.find((tier) => packQuantityFromLabel(tier.label) != null && tier.label.trim().toLowerCase() === wanted);
  if (match) return match.priceCents;
  const qty = Number.parseInt(label, 10);
  const byQty = tiers.find((tier) => packQuantityFromLabel(tier.label) === qty);
  return byQty?.priceCents ?? null;
}

function packLine(row: (typeof PRICE_INDEX_EDITION.rows)[number]) {
  return `${row.name} ${formatUsd(row.packs[30])} / ${formatUsd(row.packs[60])} / ${formatUsd(row.packs[90])}`;
}

export default async function ModafinilPriceComparisonPage() {
  const [products, pairs] = await Promise.all([loadCompareProducts(), getIndexableComparePairs()]);
  const site = getSiteUrl();
  const edition = PRICE_INDEX_EDITION;
  const pulledOn = formatPriceIndexDate(edition.pulledOn);
  const nextPull = formatPriceIndexDate(edition.nextPull);
  const rows = products.filter(isModafinilCatalogRow).map((product) => {
    const tiers = tiersForCompare(product);
    return {
      slug: product.slug,
      name: product.name,
      href: `/product/${product.slug}`,
      manufacturer: product.manufacturer,
      activeIngredient: product.activeIngredient,
      strengthMg: product.strengthMg,
      packPrices: DEFAULT_PACKS.map((label) => ({ label, priceCents: packPrice(tiers, label) })),
      costPerTabletCents: costPerTabletCents(tiers),
      costPer200mgCents: costPer200mgCents(tiers, product.strengthMg),
      reviewCount: product._count.reviews,
    };
  });

  const batchOne = pairs.filter((pair) => pair.batch === 1).slice(0, 4);
  const pageLd = buildWebPageJsonLd({
    name: TITLE,
    description: DESCRIPTION,
    path: "/modafinil-price-comparison",
    baseUrl: site,
  });
  const listLd = {
    ...pageLd,
    datePublished: edition.pulledOn,
    dateModified: edition.pulledOn,
    mainEntity: buildItemListJsonLd(
      edition.rows.map((row) => ({ name: row.name, url: `/product/${row.slug}` })),
      site,
      "Product",
    ),
  };

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Modafinil price comparison" }]} />
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{titleCaseHeading(TITLE)}</h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
        Modafinil price comparison on this page is four Modempic checkout totals pulled on{" "}
        <time dateTime={edition.pulledOn}>{pulledOn}</time>: {packLine(edition.rows[0])}; {packLine(edition.rows[1])};{" "}
        {packLine(edition.rows[2])}; and {packLine(edition.rows[3])}.
      </p>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
        {edition.quarter} index. Those 12 cells stay put until {nextPull}. Shipping is not in the total. This is catalog
        pricing, not medical or dosage advice.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <CopyPriceIndexButton text={priceIndexTsv(edition)} />
        <Link
          href={PRICE_INDEX_CSV_PATH}
          className="text-sm font-medium text-accent underline-offset-2 hover:text-accent-hover hover:underline"
        >
          Download CSV
        </Link>
      </div>

      <div className="mt-4">
        <PriceIndexTable edition={edition} />
      </div>

      <section className="mt-12 max-w-3xl" aria-labelledby="price-index-method">
        <h2 id="price-index-method" className="text-2xl font-semibold tracking-tight">
          How this index is built
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Each cell is the USD buy-box total for that pack on the named product page on {pulledOn}. Same three sizes
          every quarter: 30, 60, and 90 tablets. No coupon, no shipping, no third-party scrape.
        </p>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          The index does not update when the shop changes mid-quarter. The sortable table below is the live catalog. If
          a live pack moves, the dated row above is still the citeable figure until the next pull on {nextPull}.
        </p>
      </section>

      <section className="mt-12" aria-labelledby="live-catalog-heading">
        <h2 id="live-catalog-heading" className="text-2xl font-semibold tracking-tight">
          Every live listing
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          Sort by cost per 200 mg to line up 150 mg and 200 mg tablets. Totals match the product page right now and can
          differ from the {edition.quarter} index.
        </p>
        <div className="mt-6">
          {rows.length === 0 ? (
            <p className="text-muted-foreground">No published listings are available for this table yet.</p>
          ) : (
            <PriceComparisonTable rows={rows} packLabels={[...DEFAULT_PACKS]} />
          )}
        </div>
      </section>

      <RelatedLinks
        heading="Brand comparisons"
        links={batchOne.map((pair) => ({
          href: pair.path,
          label: comparePairDisplayLabel(pair.param),
          description: "Live pack prices and reviews for both listings.",
        }))}
      />
      <RelatedLinks
        heading="Related"
        links={[
          {
            href: PRICE_INDEX_CSV_PATH,
            label: `${edition.quarter} price index CSV`,
            description: "The same four rows, for a spreadsheet or a citation.",
          },
          { href: "/shop/nootropics", label: "Nootropics catalog", description: "Every published Modafinil and Armodafinil listing." },
          { href: "/where-to-buy-modafinil-online", label: "Where to buy Modafinil online", description: "Checkout, shipping, and pack-size overview." },
          { href: "/buy-modafinil-reddit", label: "Buy Modafinil Reddit", description: "Checkout answers for the Reddit search, not forum quotes." },
          { href: "/shipping", label: "Shipping", description: "Transit bands, tracking, and customs reship." },
        ]}
      />
      <JsonLd data={listLd} />
    </Container>
  );
}
