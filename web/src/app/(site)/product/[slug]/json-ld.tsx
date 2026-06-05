import type { Prisma } from "@prisma/client";
import { absoluteProductImageUrl } from "@/lib/cloudinary-delivery-url";
import { storefrontShortDesc } from "@/lib/product-short-desc";
import { parseVariantTiers } from "@/lib/product-variants";

type P = Prisma.ProductGetPayload<{
  include: {
    images: true;
    categories: { include: { category: true } };
    reviews: { include: { user: { select: { name: true; image: true } } } };
  };
}>;

function labelFromSpecKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function structuredProperties(product: P) {
  const rows: { name: string; value: string }[] = [];
  if (product.purity) rows.push({ name: "Purity", value: product.purity });
  if (product.testingStatus) rows.push({ name: "Testing status", value: product.testingStatus });
  if (product.storageNotes) rows.push({ name: "Storage notes", value: product.storageNotes });
  if (product.shippingRestrictions) rows.push({ name: "Shipping restrictions", value: product.shippingRestrictions });
  if (product.specifications && !Array.isArray(product.specifications) && typeof product.specifications === "object") {
    for (const [key, value] of Object.entries(product.specifications)) {
      if (value == null || value === "") continue;
      rows.push({
        name: labelFromSpecKey(key),
        value:
          typeof value === "string" || typeof value === "number" || typeof value === "boolean"
            ? String(value)
            : JSON.stringify(value),
      });
    }
  }
  return rows.map((row) => ({
    "@type": "PropertyValue" as const,
    name: row.name,
    value: row.value,
  }));
}

export function ProductJsonLd({ product, baseUrl }: { product: P; baseUrl: string }) {
  const root = baseUrl.replace(/\/$/, "");
  const productUrl = `${root}/product/${product.slug}`;
  const tiers = parseVariantTiers(product.variants);
  const low = tiers.length ? Math.min(...tiers.map((t) => t.priceCents)) / 100 : product.priceCents / 100;
  const high = tiers.length ? Math.max(...tiers.map((t) => t.priceCents)) / 100 : product.priceCents / 100;
  const aggregateOffer =
    tiers.length > 1
      ? {
          "@type": "AggregateOffer" as const,
          url: productUrl,
          priceCurrency: "USD",
          lowPrice: low.toFixed(2),
          highPrice: high.toFixed(2),
          offerCount: tiers.length,
          availability: "https://schema.org/InStock",
        }
      : null;
  const singlePriceCents = tiers.length === 1 ? tiers[0].priceCents : product.priceCents;
  const singleOffer = {
    "@type": "Offer" as const,
    url: productUrl,
    priceCurrency: "USD",
    price: (singlePriceCents / 100).toFixed(2),
    availability: "https://schema.org/InStock",
  };
  const reviewCount = product.reviews.length;
  const averageRating =
    reviewCount > 0 ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount : 0;
  const reviews = product.reviews.slice(0, 5).map((review) => ({
    "@type": "Review" as const,
    reviewRating: {
      "@type": "Rating" as const,
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      "@type": "Person" as const,
      name: review.authorName ?? review.user.name ?? "Verified customer",
    },
    datePublished: review.createdAt.toISOString().slice(0, 10),
    ...(review.title ? { name: review.title } : {}),
    reviewBody: review.body,
  }));
  const additionalProperty = structuredProperties(product);
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productUrl,
    name: product.name,
    url: productUrl,
    description: storefrontShortDesc(product.shortDesc),
    image: product.images.map((i) => absoluteProductImageUrl(i.url, root)),
    brand: { "@type": "Brand", name: "Modempic" },
    offers: aggregateOffer ?? singleOffer,
    ...(additionalProperty.length > 0 ? { additionalProperty } : {}),
    ...(reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating.toFixed(1),
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews,
        }
      : {}),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />;
}
