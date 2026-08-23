import type { Metadata } from "next";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { getMostPurchasedProductSlug } from "@/lib/data/most-purchased-product";
import { getPopularRecommendations, getProductBySlug, getPublishedProductSlugs } from "@/lib/data/products";
import { formatUsd } from "@/lib/domain/money";
import { buildProductPdpTabContent, specificationEntries } from "@/lib/catalog/product-pdp-tabs";
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
import { ProductTrustBullets } from "@/components/shop/product-trust-bullets";
import { FeaturedBlogPosts } from "@/components/blog/featured-blog-posts";
import { YouMayAlsoLike } from "@/components/shop/you-may-also-like";
import { absoluteProductImageUrl } from "@/lib/cloudinary-delivery-url";
import { getSiteUrl } from "@/lib/site-url";
import { titleCaseHeading } from "@/lib/text/heading-title-case";
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product" };
  const site = getSiteUrl();
  const title = titleCaseHeading(p.seoTitle ?? p.name);
  const description = p.seoDesc ?? storefrontShortDesc(p.shortDesc);
  const image = p.images[0]
    ? {
        url: absoluteProductImageUrl(p.images[0].url, site),
        alt: p.images[0].alt || p.name,
      }
    : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/product/${slug}`,
      siteName: "Modempic",
      images: image ? [image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image.url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [recommendations, mostPurchasedSlug] = await Promise.all([
    getPopularRecommendations(product.id, 4),
    getMostPurchasedProductSlug(),
  ]);

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
  const primaryCategorySlug = product.categories[0]?.category.slug ?? null;
  const pdpTabContent = buildProductPdpTabContent({
    specifications: product.specifications,
    shippingRestrictions: product.shippingRestrictions,
    storageNotes: product.storageNotes,
    purity: product.purity,
    testingStatus: product.testingStatus,
    primaryCategorySlug,
  });
  const hasCatalogDocumentation = Boolean(
    product.purity ||
      product.testingStatus ||
      product.coaUrl ||
      product.storageNotes ||
      product.shippingRestrictions ||
      specs.length > 0,
  );
  const faqJsonLd =
    pdpTabContent.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: pdpTabContent.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }
      : null;

  return (
    <>
      <ProductJsonLd product={product} baseUrl={site} />
      {faqJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      ) : null}
      <Container className="py-10 pb-24 sm:py-14 sm:pb-16">
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

        {/* Two-column: sticky gallery (left) / scrollable details (right) */}
        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductImageGallery
              key={product.id}
              images={product.images.map((im) => ({
                id: im.id,
                url: im.url,
                alt: im.alt || product.name,
              }))}
              productName={product.name}
            />
          </div>

          <div className="flex flex-col">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {titleCaseHeading(product.name)}
            </h1>

            <ProductReviewSummary reviewCount={reviewCount} averageRating={averageRating} />

            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-semibold tabular-nums text-foreground">{priceMain}</span>
              {compareStrikeCents != null ? (
                <span className="text-lg text-muted-foreground line-through">
                  {formatUsd(compareStrikeCents)}
                </span>
              ) : null}
            </div>

            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              {storefrontShortDesc(product.shortDesc)}
            </p>

            <ProductTrustBullets />

            <ProductInternalLinks
              categoryHref={
                product.categories[0] ? `/shop/${product.categories[0].category.slug}` : null
              }
              categoryLabel={product.categories[0]?.category.name ?? null}
              hasCatalogDocumentation={hasCatalogDocumentation}
            />

            <ProductPurchaseSection
              key={product.id}
              productId={product.id}
              slug={product.slug}
              tiers={variantTiers}
              productName={product.name}
              headlinePrice={priceMain}
            />

            <GuaranteedSafeCheckout />

            {product.disclaimer ? (
              <p className="mt-6 rounded-2xl border border-border bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                {product.disclaimer}
              </p>
            ) : null}
          </div>
        </div>

        {hasCatalogDocumentation ? (
          <section
            id="documentation"
            className="mt-16 scroll-mt-28 rounded-2xl border border-border bg-card p-6 sm:p-10"
          >
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Product details
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                Product Documentation and Handling Notes
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Structured product information for review before ordering. Always follow the product label and any linked
                documentation.
              </p>
            </div>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.purity ? (
                <div className="rounded-xl border border-border bg-muted p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Purity</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{product.purity}</dd>
                </div>
              ) : null}
              {product.testingStatus ? (
                <div className="rounded-xl border border-border bg-muted p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Testing</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{product.testingStatus}</dd>
                </div>
              ) : null}
              {product.coaUrl ? (
                <div className="rounded-xl border border-border bg-muted p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">COA</dt>
                  <dd className="mt-1 text-sm font-medium">
                    <a
                      href={product.coaUrl}
                      className="text-accent underline-offset-2 transition-colors hover:text-accent-hover hover:underline"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View certificate
                    </a>
                  </dd>
                </div>
              ) : null}
              {specs.map((spec) => (
                <div key={spec.label} className="rounded-xl border border-border bg-muted p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {spec.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{spec.value}</dd>
                </div>
              ))}
            </dl>
            {product.storageNotes || product.shippingRestrictions ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {product.storageNotes ? (
                  <div className="rounded-xl border border-border bg-muted p-4">
                    <h3 className="text-sm font-semibold text-foreground">Storage Notes</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                      {product.storageNotes}
                    </p>
                  </div>
                ) : null}
                {product.shippingRestrictions ? (
                  <div className="rounded-xl border border-border bg-muted p-4">
                    <h3 className="text-sm font-semibold text-foreground">Shipping Restrictions</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
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
          tabContent={pdpTabContent}
        />

        <FeaturedBlogPosts heading="Related reading" />

        <YouMayAlsoLike products={recommendations} mostPurchasedSlug={mostPurchasedSlug} />
      </Container>
    </>
  );
}
