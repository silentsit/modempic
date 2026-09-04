import type { Metadata } from "next";
import Link from "next/link";
import { getMostPurchasedProductSlug } from "@/lib/data/most-purchased-product";
import { getPublishedProducts, listCategories } from "@/lib/data/products";
import { prismaToStoreProduct } from "@/lib/catalog/prisma-to-store-product";
import { ShopCategoryIntroLinks } from "@/lib/shop-category-links";
import { normalizeShopQuery, productMatchesQuery } from "@/lib/shop/product-search";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Container } from "@/components/site/container";
import { DEFAULT_SHARE_IMAGE } from "@/lib/seo/page-metadata";
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
  const [{ query }, catalog, categories, mostPurchasedSlug] = await Promise.all([
    searchParams,
    getPublishedProducts(),
    listCategories(),
    getMostPurchasedProductSlug(),
  ]);
  const searchQuery = normalizeShopQuery(query);
  const visible = searchQuery
    ? catalog.filter((product) => productMatchesQuery(product, searchQuery))
    : catalog;
  const products = visible.map((product) => prismaToStoreProduct(product, { listing: true }));

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Live catalog</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Shop</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          Shop by category: <ShopCategoryIntroLinks categories={categories} />. Review each product label and
          documentation before ordering. See our{" "}
          <Link href="/shop/best-sellers" className="font-medium text-accent underline-offset-2 transition-colors hover:text-accent-hover hover:underline">best sellers</Link>{" "}
          or read the <Link href="/blog" className="font-medium text-accent underline-offset-2 transition-colors hover:text-accent-hover hover:underline">blog</Link>.
        </p>
        <form action="/shop" className="mt-6 flex w-full max-w-xl flex-col gap-2 sm:flex-row" role="search">
          <label htmlFor="shop-search" className="sr-only">
            Search products
          </label>
          <input
            key={searchQuery}
            id="shop-search"
            name="query"
            type="search"
            defaultValue={searchQuery}
            placeholder="Search products"
            className="min-h-11 flex-1 rounded-full border border-input bg-background px-4 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          />
          <button
            type="submit"
            className="min-h-11 w-full rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
          >
            Search
          </button>
        </form>
      </div>
      <ShopSearchResults
        products={products}
        catalogCount={catalog.length}
        query={searchQuery}
        mostPurchasedSlug={mostPurchasedSlug}
      />
    </Container>
  );
}
