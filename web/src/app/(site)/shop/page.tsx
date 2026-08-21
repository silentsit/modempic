import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getMostPurchasedProductSlug } from "@/lib/data/most-purchased-product";
import { getPublishedProducts, listCategories } from "@/lib/data/products";
import { ShopCategoryIntroLinks } from "@/lib/shop-category-links";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Container } from "@/components/site/container";
import { ShopSearchResults } from "./shop-search-results";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the Modempic catalog with USD pricing, clear labels, and secure card or crypto checkout.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Shop | Modempic",
    description: "Browse the Modempic catalog with USD pricing, clear labels, and secure card or crypto checkout.",
    url: "/shop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop | Modempic",
    description: "Browse the Modempic catalog with USD pricing, clear labels, and secure card or crypto checkout.",
  },
};

export default async function ShopPage() {
  const [products, categories, mostPurchasedSlug] = await Promise.all([
    getPublishedProducts(),
    listCategories(),
    getMostPurchasedProductSlug(),
  ]);

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <div className="mt-6 grid gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Live catalog</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Shop</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Shop by category: <ShopCategoryIntroLinks categories={categories} />. Review each product label and
            documentation before ordering. See our{" "}
            <Link href="/shop/best-sellers" className="font-medium text-accent underline-offset-2 transition-colors hover:text-accent-hover hover:underline">best sellers</Link>{" "}
            or read the <Link href="/blog" className="font-medium text-accent underline-offset-2 transition-colors hover:text-accent-hover hover:underline">blog</Link>.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:min-w-72">
          <div className="rounded-xl border border-border bg-muted p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Products</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{products.length}</dd>
          </div>
          <div className="rounded-xl border border-border bg-muted p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checkout</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">Crypto-secure</dd>
          </div>
        </dl>
      </div>
      <Suspense fallback={<p className="mt-10 text-sm text-muted-foreground">Loading catalog...</p>}>
        <ShopSearchResults products={products} categories={categories} mostPurchasedSlug={mostPurchasedSlug} />
      </Suspense>
    </Container>
  );
}
