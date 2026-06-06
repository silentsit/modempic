import type { Prisma } from "@prisma/client";
import { absoluteProductImageUrl } from "@/lib/cloudinary-delivery-url";
import { storefrontShortDesc } from "@/lib/product-short-desc";
import { parseVariantTiers } from "@/lib/product-variants";

export type ProductJsonLdInput = Prisma.ProductGetPayload<{
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

function structuredProperties(product: ProductJsonLdInput) {
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

export function productAggregateRating(reviews: ProductJsonLdInput["reviews"]) {
  const reviewCount = reviews.length;
  if (reviewCount === 0) return null;

  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  const ratingValue = Math.round((sum / reviewCount) * 10) / 10;

  return {
    "@type": "AggregateRating" as const,
    ratingValue,
    reviewCount,
    ratingCount: reviewCount,
    bestRating: 5,
    worstRating: 1,
  };
}

export function buildProductJsonLd(product: ProductJsonLdInput, baseUrl: string) {
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

  const aggregateRating = productAggregateRating(product.reviews);
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

  return {
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
    ...(aggregateRating ? { aggregateRating, review: reviews } : {}),
  };
}
