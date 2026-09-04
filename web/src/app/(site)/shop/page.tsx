import type { Metadata } from "next";
import { getMostPurchasedProductSlug } from "@/lib/data/most-purchased-product";
import { getPublishedProducts } from "@/lib/data/products";
import { prismaToStoreProduct } from "@/lib/catalog/prisma-to-store-product";
import { normalizeShopQuery, productMatchesQuery } from "@/lib/shop/product-search";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Container } from "@/components/site/container";
import { DEFAULT_SHARE_IMAGE } from "@/lib/seo/page-metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { buildCollectionPageJsonLd } from "@/lib/seo/listing-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { ShopSearchResults } from "./shop-search-results";

export const revalidate = 3600;

const SHOP_DESCRIPTION =
  "Browse the Modempic catalog with USD pricing, clear labels, and secure card or crypto checkout.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}): Promise<Metadata> {
  const { query } = await searchParams;
  const hasQuery = Boolean(normalizeShopQuery(query));
  return {
    title: "Shop",
    description: SHOP_DESCRIPTION,
    alternates: { canonical: "/shop" },
    robots: hasQuery ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: "Shop | Modempic",
      description: SHOP_DESCRIPTION,
      url: "/shop",
      type: "website",
      images: [DEFAULT_SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: "Shop | Modempic",
      description: SHOP_DESCRIPTION,
      images: [DEFAULT_SHARE_IMAGE.url],
    },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const [{ query }, catalog, mostPurchasedSlug] = await Promise.all([
    searchParams,
    getPublishedProducts(),
    getMostPurchasedProductSlug(),
  ]);
  const searchQuery = normalizeShopQuery(query);
  const visible = searchQuery
    ? catalog.filter((product) => productMatchesQuery(product, searchQuery))
    : catalog;
  const products = visible.map((product) => prismaToStoreProduct(product, { listing: true }));
  const site = getSiteUrl().replace(/\/$/, "");
  const collectionLd = buildCollectionPageJsonLd({
    name: "Shop",
    description: SHOP_DESCRIPTION,
    path: "/shop",
    items: products.map((product) => ({
      name: product.title,
      url: `/product/${product.handle}`,
    })),
    baseUrl: site,
  });

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Shop</h1>
      <ShopSearchResults
        products={products}
        catalogCount={catalog.length}
        query={searchQuery}
        mostPurchasedSlug={mostPurchasedSlug}
      />
      {searchQuery ? null : <JsonLd data={collectionLd} />}
    </Container>
  );
}
