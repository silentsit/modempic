import type { Metadata } from "next";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { getPopularRecommendations, getProductBySlug, getPublishedProductSlugs } from "@/lib/data/products";
import { formatUsd } from "@/lib/domain/money";
import { productInPeptidesCategory } from "@/lib/catalog/peptide-category";
import { tiersFromProduct } from "@/lib/catalog/product-variant-store";
import { formatProductPriceDisplay, productHeadlineCompareStrikeCents } from "@/lib/product-variants";
import { storefrontShortDesc } from "@/lib/product-short-desc";
import { sanitizeProductBodyHtml } from "@/lib/product-html";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Container } from "@/components/site/container";
import { GuaranteedSafeCheckout } from "@/components/shop/guaranteed-safe-checkout";
import { ProductDetailTabs } from "@/components/shop/product-detail-tabs";
import { ProductImageGallery } from "@/components/shop/product-image-gallery";
import { ProductInternalLinks } from "@/components/shop/product-internal-links";
import { ProductPurchaseSection } from "@/components/shop/product-purchase-section";
import { ProductReviewSummary } from "@/components/shop/product-review-summary";
import { ProductRuoBanner } from "@/components/shop/product-ruo-banner";
import { ProductTestingCoaStrip } from "@/components/shop/product-testing-coa-strip";
import { ProductTrustBullets } from "@/components/shop/product-trust-bullets";
import { YouMayAlsoLike } from "@/components/shop/you-may-also-like";
import { absoluteProductImageUrl } from "@/lib/cloudinary-delivery-url";
import { getSiteUrl } from "@/lib/site-url";
import { ProductJsonLd } from "./json-ld";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

const SIGNED_OUT_REVIEW_ELIGIBILITY = {
  isSignedIn: false,
  canSubmit: false,
  reason: "sign_in" as const,
};

export async function generateStaticParams() {
  const products = await getPublishedProductSlugs();
  return products.map((product) => ({ slug: product.slug }));
}

function labelFromSpecKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function specificationEntries(raw: unknown) {
  if (!raw || Array.isArray(raw) || typeof raw !== "object") return [];
  return Object.entries(raw as Record<string, unknown>)
    .map(([key, value]) => {
      if (value == null || value === "") return null;
      const display = typeof value === "string" || typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : JSON.stringify(value);
      return { label: labelFromSpecKey(key), value: display };
    })
    .filter((row): row is { label: string; value: string } => Boolean(row));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product" };
  const site = getSiteUrl();
  return {
    title: p.seoTitle ?? p.name,
    description: p.seoDesc ?? storefrontShortDesc(p.shortDesc),
    alternates: { canonical: `/product/${slug}` },
    openGraph: p.images[0] ? { images: [{ url: absoluteProductImageUrl(p.images[0].url, site) }] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const recommendations = await getPopularRecommendations(product.id, 4);

  const site = getSiteUrl();
  const variantTiers = tiersFromProduct(product);
  const bodySafe = product.bodyHtml ? sanitizeProductBodyHtml(product.bodyHtml) : null;
  const priceMain = formatProductPriceDisplay(product);
  const compareStrikeCents = productHeadlineCompareStrikeCents(product);
  const reviewCount = product.reviews.length;
  const averageRating =
    reviewCount > 0 ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
  const reviewItems = product.reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    authorName: r.authorName ?? r.user.name,
    createdAtIso: r.createdAt.toISOString(),
    createdAtLabel: format(r.createdAt, "dd/MM/yyyy"),
  }));
  const longDescParagraphs = product.longDesc
    .split(/\n\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const specs = specificationEntries(product.specifications);
  const isPeptideProduct = productInPeptidesCategory(product.categories);
  const hasResearchDetails = Boolean(
    isPeptideProduct &&
      (product.purity ||
        product.testingStatus ||
        product.coaUrl ||
        product.storageNotes ||
        product.shippingRestrictions ||
        specs.length > 0),
  );

  return (
    <>
      <ProductJsonLd product={product} baseUrl={site} />
      <Container className="pb-24 py-10 sm:pb-14 sm:py-14 lg:pb-14">
        <Breadcrumbs
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            ...(product.categories[0]
              ? [
                  {
                    label: product.categories[0].category.name,
                    href: `/shop/${product.categories[0].category.slug}`,
                  },
                ]
              : []),
            { label: product.name },
          ]}
        />

        {isPeptideProduct ? (
          <div className="mt-6">
            <ProductRuoBanner />
          </div>
        ) : null}

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
          <ProductImageGallery
            key={product.id}
            images={product.images.map((im) => ({
              id: im.id,
              url: im.url,
              alt: im.alt || product.name,
            }))}
            productName={product.name}
          />

          <div className="flex flex-col lg:sticky lg:top-24">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--hero)] sm:text-4xl">
              {product.name}
            </h1>

            <ProductReviewSummary reviewCount={reviewCount} averageRating={averageRating} />

            <div className="mt-6 flex flex-wrap items-baseline gap-2 gap-y-1">
              <span className="text-3xl font-semibold tabular-nums text-[var(--foreground)]">{priceMain}</span>
              {compareStrikeCents != null ? (
                <span className="text-lg text-[var(--muted-foreground)] line-through">
                  {formatUsd(compareStrikeCents)}
                </span>
              ) : null}
            </div>

            <p className="mt-5 text-base leading-relaxed text-[var(--foreground)]">
              {storefrontShortDesc(product.shortDesc)}
            </p>

            <ProductTrustBullets />

            {isPeptideProduct ? (
              <ProductTestingCoaStrip
                purity={product.purity}
                testingStatus={product.testingStatus}
                coaUrl={product.coaUrl}
              />
            ) : null}

            <ProductInternalLinks
              categoryHref={
                product.categories[0] ? `/shop/${product.categories[0].category.slug}` : null
              }
              categoryLabel={product.categories[0]?.category.name ?? null}
              hasResearchDetails={hasResearchDetails}
              showResearchResources={isPeptideProduct}
            />

            <ProductPurchaseSection
              key={product.id}
              slug={product.slug}
              tiers={variantTiers}
              productName={product.name}
              headlinePrice={priceMain}
            />

            <GuaranteedSafeCheckout />

            {isPeptideProduct && product.disclaimer ? (
              <p className="mt-6 text-xs leading-relaxed text-[var(--muted-foreground)]">{product.disclaimer}</p>
            ) : null}
          </div>
        </div>

        {hasResearchDetails ? (
          <section
            id="documentation"
            className="mt-12 scroll-mt-28 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8"
          >
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                Research-use details
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[var(--hero)]">
                Product documentation and handling notes
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                Structured product information for laboratory review. Always follow the product label and any linked
                documentation before handling.
              </p>
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.purity ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Purity</dt>
                  <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{product.purity}</dd>
                </div>
              ) : null}
              {product.testingStatus ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Testing</dt>
                  <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{product.testingStatus}</dd>
                </div>
              ) : null}
              {product.coaUrl ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">COA</dt>
                  <dd className="mt-1 text-sm font-medium">
                    <a
                      href={product.coaUrl}
                      className="text-[var(--primary)] underline-offset-2 hover:underline"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View certificate
                    </a>
                  </dd>
                </div>
              ) : null}
              {specs.map((spec) => (
                <div key={spec.label} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    {spec.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{spec.value}</dd>
                </div>
              ))}
            </dl>
            {product.storageNotes || product.shippingRestrictions ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {product.storageNotes ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Storage notes</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--muted-foreground)]">
                      {product.storageNotes}
                    </p>
                  </div>
                ) : null}
                {product.shippingRestrictions ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Shipping restrictions</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--muted-foreground)]">
                      {product.shippingRestrictions}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        <ProductDetailTabs
          bodyHtml={bodySafe}
          longDescParagraphs={longDescParagraphs}
          reviews={reviewItems}
          productId={product.id}
          productSlug={product.slug}
          reviewEligibility={SIGNED_OUT_REVIEW_ELIGIBILITY}
        />

        <YouMayAlsoLike products={recommendations} />
      </Container>
    </>
  );
}
