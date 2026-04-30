import type { Prisma } from "@prisma/client";
import { parseVariantTiers } from "@/lib/product-variants";

type P = Prisma.ProductGetPayload<{
  include: { images: true; categories: { include: { category: true } } };
}>;

export function ProductJsonLd({ product, baseUrl }: { product: P; baseUrl: string }) {
  const root = baseUrl.replace(/\/$/, "");
  const productUrl = `${root}/product/${product.slug}`;
  const cat = product.categories[0]?.category;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${root}/` },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${root}/shop` },
      ...(cat
        ? [{ "@type": "ListItem" as const, position: 3, name: cat.name, item: `${root}/shop/${cat.slug}` }]
        : []),
      {
        "@type": "ListItem",
        position: cat ? 4 : 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };
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
    description: product.shortDesc,
    image: product.images.map((i) => i.url),
    brand: { "@type": "Brand", name: "Modempic" },
    offers: aggregateOffer ?? singleOffer,
  };
  const graph = { "@context": "https://schema.org", "@graph": [productLd, breadcrumb] };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
