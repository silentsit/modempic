import type { Prisma } from "@prisma/client";
import { absoluteProductImageUrl } from "@/lib/cloudinary-delivery-url";
import { storefrontShortDesc } from "@/lib/product-short-desc";
import { parseVariantTiers } from "@/lib/product-variants";

type P = Prisma.ProductGetPayload<{
  include: { images: true; categories: { include: { category: true } } };
}>;

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
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: storefrontShortDesc(product.shortDesc),
    image: product.images.map((i) => absoluteProductImageUrl(i.url, root)),
    brand: { "@type": "Brand", name: "Modempic" },
    offers: aggregateOffer ?? singleOffer,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />;
}
