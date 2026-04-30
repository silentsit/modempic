import type { Metadata } from "next";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/data/products";
import { formatUsd } from "@/lib/domain/money";
import { sanitizeProductBodyHtml } from "@/lib/product-html";
import { parseVariantTiers } from "@/lib/product-variants";
import { Container } from "@/components/site/container";
import { GuaranteedSafeCheckout } from "@/components/shop/guaranteed-safe-checkout";
import { ProductDetailTabs } from "@/components/shop/product-detail-tabs";
import { ProductImageGallery } from "@/components/shop/product-image-gallery";
import { ProductPurchaseSection } from "@/components/shop/product-purchase-section";
import { ProductReviewSummary } from "@/components/shop/product-review-summary";
import { ProductTrustBullets } from "@/components/shop/product-trust-bullets";
import { getSiteUrl } from "@/lib/site-url";
import { ProductJsonLd } from "./json-ld";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product" };
  return {
    title: p.seoTitle ?? p.name,
    description: p.seoDesc ?? p.shortDesc,
    openGraph: p.images[0] ? { images: [{ url: p.images[0].url }] } : undefined,
  };
}

function primaryPriceDisplay(product: {
  priceCents: number;
  compareAtCents: number | null;
  variants: unknown;
}) {
  const tiers = parseVariantTiers(product.variants);
  if (tiers.length > 1) {
    const lows = tiers.map((t) => t.priceCents);
    const min = Math.min(...lows);
    const max = Math.max(...lows);
    return min === max ? formatUsd(min) : `${formatUsd(min)} – ${formatUsd(max)}`;
  }
  return formatUsd(product.priceCents);
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const site = getSiteUrl();
  const variantTiers = parseVariantTiers(product.variants);
  const bodySafe = product.bodyHtml ? sanitizeProductBodyHtml(product.bodyHtml) : null;
  const priceMain = primaryPriceDisplay(product);
  const showCompareStrike =
    variantTiers.length <= 1 && product.compareAtCents && product.compareAtCents > product.priceCents;
  const reviewCount = product.reviews.length;
  const averageRating =
    reviewCount > 0 ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
  const reviewItems = product.reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    authorName: r.user.name,
    createdAtIso: r.createdAt.toISOString(),
    createdAtLabel: format(r.createdAt, "MMMM d, yyyy"),
  }));
  const longDescParagraphs = product.longDesc
    .split(/\n\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <ProductJsonLd product={product} baseUrl={site} />
      <Container className="py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-[var(--muted-foreground)]">
          <ol className="flex flex-wrap gap-1">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/shop" className="hover:underline">
                Shop
              </Link>
            </li>
            {product.categories[0] ? (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link href={`/shop/${product.categories[0].category.slug}`} className="hover:underline">
                    {product.categories[0].category.name}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden>/</li>
            <li className="text-[var(--foreground)]">{product.name}</li>
          </ol>
        </nav>

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
            <h1 className="font-serif text-3xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100 sm:text-4xl">
              {product.name}
            </h1>

            <ProductReviewSummary reviewCount={reviewCount} averageRating={averageRating} />

            <div className="mt-6 flex flex-wrap items-baseline gap-2 gap-y-1">
              <span className="text-3xl font-semibold tabular-nums text-[var(--foreground)]">{priceMain}</span>
              {showCompareStrike ? (
                <span className="text-lg text-[var(--muted-foreground)] line-through">
                  {formatUsd(product.compareAtCents!)}
                </span>
              ) : null}
            </div>

            <p className="mt-5 text-base leading-relaxed text-[var(--foreground)]">{product.shortDesc}</p>

            <ProductTrustBullets />

            <ProductPurchaseSection key={product.id} productId={product.id} tiers={variantTiers} />

            <GuaranteedSafeCheckout />

            {product.disclaimer ? (
              <p className="mt-6 text-xs leading-relaxed text-[var(--muted-foreground)]">{product.disclaimer}</p>
            ) : null}
          </div>
        </div>

        <ProductDetailTabs bodyHtml={bodySafe} longDescParagraphs={longDescParagraphs} reviews={reviewItems} />
      </Container>
    </>
  );
}
