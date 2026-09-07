import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import {
  canonicalComparePair,
  comparePairDisplayLabel,
  isCanonicalCompareParam,
  parseComparePairParam,
} from "@/lib/compare/compare-keys";
import { compareDescription, compareDocumentTitle, compareHeading, compareIntro } from "@/lib/compare/compare-page-copy";
import { costPer200mgCents, costPerTabletCents, tiersForCompare } from "@/lib/compare/cost-per-dose";
import {
  getComparePairByParam,
  getComparisonsForProduct,
  getCompareProductsBySlugs,
  getIndexableComparePairs,
} from "@/lib/data/compare";
import { formatUsd } from "@/lib/domain/money";
import { formatUsdEachFromCents } from "@/lib/product-variants";
import { DEFAULT_SHARE_IMAGE, MISSING_ENTITY_METADATA, pageDocumentTitle, pageShareTitle } from "@/lib/seo/page-metadata";
import { buildItemListJsonLd } from "@/lib/seo/listing-json-ld";
import { buildWebPageJsonLd } from "@/lib/seo/page-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { titleCaseHeading } from "@/lib/text/heading-title-case";

export const revalidate = 3600;

type Props = { params: Promise<{ pair: string }> };

export async function generateStaticParams() {
  const pairs = await getIndexableComparePairs();
  return pairs.map((pair) => ({ pair: pair.param }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair } = await params;
  const parsed = parseComparePairParam(pair);
  if (!parsed) return { title: "Compare", ...MISSING_ENTITY_METADATA };
  const record = await getComparePairByParam(canonicalComparePair(parsed.left, parsed.right).param);
  if (!record) return { title: "Compare", ...MISSING_ENTITY_METADATA };
  if (!isCanonicalCompareParam(pair)) return { title: "Compare", ...MISSING_ENTITY_METADATA };
  const products = await getCompareProductsBySlugs([record.leftSlug, record.rightSlug]);
  const left = products.find((product) => product.slug === record.leftSlug);
  const right = products.find((product) => product.slug === record.rightSlug);
  if (!left || !right) return { title: "Compare", ...MISSING_ENTITY_METADATA };
  const title = compareDocumentTitle(left.name, right.name);
  const description = compareDescription(left.name, right.name);
  return {
    title: pageDocumentTitle(title),
    description,
    alternates: { canonical: record.path },
    openGraph: {
      title: pageShareTitle(title),
      description,
      url: record.path,
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

function specRows(
  product: Awaited<ReturnType<typeof getCompareProductsBySlugs>>[number],
  tiers: ReturnType<typeof tiersForCompare>,
) {
  return [
    { label: "Manufacturer", value: product.manufacturer ?? "Not listed" },
    { label: "Active ingredient", value: product.activeIngredient ?? "Not listed" },
    { label: "Strength", value: product.strengthMg != null ? `${product.strengthMg} mg` : "Not listed" },
    { label: "Pack tiers", value: String(tiers.length) },
    {
      label: "Lowest per tablet",
      value: costPerTabletCents(tiers) != null ? formatUsdEachFromCents(costPerTabletCents(tiers)!) : "—",
    },
    {
      label: "Lowest per 200 mg",
      value: costPer200mgCents(tiers, product.strengthMg) != null
        ? formatUsdEachFromCents(costPer200mgCents(tiers, product.strengthMg)!)
        : "—",
    },
    { label: "Reviews", value: String(product._count.reviews) },
  ];
}

export default async function ComparePairPage({ params }: Props) {
  const { pair } = await params;
  const parsed = parseComparePairParam(pair);
  if (!parsed) notFound();
  const canonical = canonicalComparePair(parsed.left, parsed.right);
  const record = await getComparePairByParam(canonical.param);
  if (!record) notFound();
  if (!isCanonicalCompareParam(pair)) {
    permanentRedirect(`/compare/${canonical.param}`);
  }
  const products = await getCompareProductsBySlugs([record.leftSlug, record.rightSlug]);
  const left = products.find((product) => product.slug === record.leftSlug);
  const right = products.find((product) => product.slug === record.rightSlug);
  if (!left || !right) notFound();

  const leftTiers = tiersForCompare(left);
  const rightTiers = tiersForCompare(right);
  const heading = compareHeading(left, right);
  const site = getSiteUrl();
  const sibling = [
    ...(await getComparisonsForProduct(left.slug, 4)),
    ...(await getComparisonsForProduct(right.slug, 4)),
  ]
    .filter((item) => item.param !== record.param)
    .filter((item, index, all) => all.findIndex((row) => row.param === item.param) === index)
    .slice(0, 6);

  const pageLd = buildWebPageJsonLd({
    name: heading,
    description: compareDescription(left.name, right.name),
    path: record.path,
    baseUrl: site,
  });
  const graph = {
    ...pageLd,
    mainEntity: buildItemListJsonLd(
      [
        { name: left.name, url: `/product/${left.slug}` },
        { name: right.name, url: `/product/${right.slug}` },
      ],
      site,
    ),
  };

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Modafinil price comparison", href: "/modafinil-price-comparison" },
          { label: heading },
        ]}
      />
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{titleCaseHeading(heading)}</h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">{compareIntro(left.name, right.name)}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {[left, right].map((product) => {
          const tiers = product.slug === left.slug ? leftTiers : rightTiers;
          return (
            <article key={product.slug} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{product.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{product.manufacturer}</p>
              <dl className="mt-6 space-y-3 text-sm">
                {specRows(product, tiers).map((row) => (
                  <div key={row.label} className="flex justify-between gap-4 border-b border-border/70 pb-2">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="font-medium text-foreground">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <ul className="mt-6 space-y-2 text-sm">
                {tiers.map((tier) => (
                  <li key={tier.label} className="flex justify-between gap-4">
                    <span>{tier.label}</span>
                    <span className="tabular-nums">{formatUsd(tier.priceCents)}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-6" asChild>
                <Link href={`/product/${product.slug}`}>Open {product.name}</Link>
              </Button>
            </article>
          );
        })}
      </div>

      <section className="mt-12" aria-labelledby="compare-reviews-heading">
        <h2 id="compare-reviews-heading" className="text-2xl font-semibold tracking-tight">
          Customer reviews on these listings
        </h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {[left, right].map((product) => (
            <div key={`${product.slug}-reviews`} className="rounded-2xl border border-border bg-muted/40 p-6">
              <h3 className="font-semibold text-foreground">{product.name}</h3>
              {product.reviews.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No approved reviews on this listing yet.</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {product.reviews.slice(0, 3).map((review) => (
                    <li key={review.id}>
                      <p className="text-sm font-medium text-foreground">
                        {review.rating}/5{review.title ? ` — ${review.title}` : ""}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{review.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <RelatedLinks
        heading="More comparisons"
        links={sibling.map((item) => ({
          href: item.path,
          label: comparePairDisplayLabel(item.param),
        }))}
      />
      <RelatedLinks
        heading="Related"
        links={[
          { href: "/modafinil-price-comparison", label: "Modafinil price comparison", description: "Every live pack in one table." },
          { href: `/product/${left.slug}`, label: left.name },
          { href: `/product/${right.slug}`, label: right.name },
          { href: "/shop/nootropics", label: "Nootropics catalog" },
        ]}
      />
      <JsonLd data={graph} />
    </Container>
  );
}
