import type { Metadata } from "next";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { getPopularRecommendations, getProductBySlug } from "@/lib/data/products";
import { getProductReviewEligibility } from "@/lib/data/reviews";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { formatUsd } from "@/lib/domain/money";
import { formatProductPriceDisplay, parseVariantTiers, productHeadlineCompareStrikeCents } from "@/lib/product-variants";
import { storefrontShortDesc } from "@/lib/product-short-desc";
import { sanitizeProductBodyHtml } from "@/lib/product-html";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Container } from "@/components/site/container";
import { GuaranteedSafeCheckout } from "@/components/shop/guaranteed-safe-checkout";
import { ProductDetailTabs } from "@/components/shop/product-detail-tabs";
import { ProductImageGallery } from "@/components/shop/product-image-gallery";
import { ProductPurchaseSection } from "@/components/shop/product-purchase-section";
import { ProductReviewSummary } from "@/components/shop/product-review-summary";
import { ProductTrustBullets } from "@/components/shop/product-trust-bullets";
import { YouMayAlsoLike } from "@/components/shop/you-may-also-like";
import { absoluteProductImageUrl } from "@/lib/cloudinary-delivery-url";
import { getSiteUrl } from "@/lib/site-url";
import { ProductJsonLd } from "./json-ld";

type Props = { params: Promise<{ slug: string }> };

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
  const session = await auth();
  const reviewEligibility = await getProductReviewEligibility(
    session?.user?.id,
    product.id,
    session?.user?.role as Role | undefined,
  );

  const site = getSiteUrl();
  const variantTiers = parseVariantTiers(product.variants);
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

  return (
    <>
      <ProductJsonLd product={product} baseUrl={site} />
      <Container className="py-10 sm:py-14">
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

            <ProductPurchaseSection key={product.id} slug={product.slug} tiers={variantTiers} />

            <GuaranteedSafeCheckout />

            {product.disclaimer ? (
              <p className="mt-6 text-xs leading-relaxed text-[var(--muted-foreground)]">{product.disclaimer}</p>
            ) : null}
          </div>
        </div>

        <ProductDetailTabs
          bodyHtml={bodySafe}
          longDescParagraphs={longDescParagraphs}
          reviews={reviewItems}
          productId={product.id}
          productSlug={product.slug}
          reviewEligibility={reviewEligibility}
        />

        <YouMayAlsoLike products={recommendations} />
      </Container>
    </>
  );
}
