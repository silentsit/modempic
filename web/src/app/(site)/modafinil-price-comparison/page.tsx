import type { Metadata } from "next";
import Link from "next/link";
import { PriceComparisonTable } from "@/components/compare/price-comparison-table";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { comparePairDisplayLabel } from "@/lib/compare/compare-keys";
import { getIndexableComparePairs, loadCompareProducts } from "@/lib/data/compare";
import { costPer200mgCents, costPerTabletCents, packQuantityFromLabel, tiersForCompare } from "@/lib/compare/cost-per-dose";
import { DEFAULT_SHARE_IMAGE, pageDocumentTitle, pageShareTitle } from "@/lib/seo/page-metadata";
import { buildItemListJsonLd } from "@/lib/seo/listing-json-ld";
import { buildWebPageJsonLd } from "@/lib/seo/page-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { titleCaseHeading } from "@/lib/text/heading-title-case";

export const revalidate = 3600;

const TITLE = "Modafinil price comparison";
const DESCRIPTION =
  "Modafinil price comparison of live Modempic pack tiers, with cost per tablet and cost per 200 mg from current USD prices.";

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

const DEFAULT_PACKS = ["30 pills", "50 pills", "100 pills"] as const;

function packPrice(tiers: ReturnType<typeof tiersForCompare>, label: string): number | null {
  const wanted = label.toLowerCase();
  const match = tiers.find((tier) => packQuantityFromLabel(tier.label) != null && tier.label.trim().toLowerCase() === wanted);
  if (match) return match.priceCents;
  const qty = Number.parseInt(label, 10);
  const byQty = tiers.find((tier) => packQuantityFromLabel(tier.label) === qty);
  return byQty?.priceCents ?? null;
}

export default async function ModafinilPriceComparisonPage() {
  const [products, pairs] = await Promise.all([loadCompareProducts(), getIndexableComparePairs()]);
  const site = getSiteUrl();
  const rows = products.map((product) => {
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

  const batchOne = pairs.filter((pair) => pair.batch === 1).slice(0, 12);
  const pageLd = buildWebPageJsonLd({
    name: TITLE,
    description: DESCRIPTION,
    path: "/modafinil-price-comparison",
    baseUrl: site,
  });
  const listLd = {
    ...pageLd,
    mainEntity: buildItemListJsonLd(
      rows.map((row) => ({ name: row.name, url: row.href })),
      site,
    ),
  };

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Modafinil price comparison" }]} />
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{titleCaseHeading(TITLE)}</h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
        Modafinil price comparison on this page uses the live pack tiers from each published listing. Sort by cost per
        200 mg to line up 150 mg and 200 mg tablets on one unit. Totals are USD and match the product page.
      </p>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
        Manufacturer names appear only when a public listing names them. This table is catalog pricing, not medical or
        dosage advice. See <Link href="/shipping" className="text-accent underline-offset-2 hover:underline">shipping</Link>{" "}
        for transit bands.
      </p>

      <div className="mt-10">
        {rows.length === 0 ? (
          <p className="text-muted-foreground">No published listings are available for this table yet.</p>
        ) : (
          <PriceComparisonTable rows={rows} packLabels={[...DEFAULT_PACKS]} />
        )}
      </div>

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
          { href: "/shop/nootropics", label: "Nootropics catalog", description: "Every published Modafinil and Armodafinil listing." },
          { href: "/where-to-buy-modafinil-online", label: "Where to buy Modafinil online", description: "Checkout, shipping, and pack-size overview." },
          { href: "/shipping", label: "Shipping", description: "Transit bands, tracking, and customs reship." },
        ]}
      />
      <JsonLd data={listLd} />
    </Container>
  );
}
