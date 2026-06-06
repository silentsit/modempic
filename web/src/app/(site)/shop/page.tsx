import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getPublishedProducts, listCategories } from "@/lib/data/products";
import { ShopCategoryIntroLinks } from "@/lib/shop-category-links";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Container } from "@/components/site/container";
import { ShopSearchResults } from "./shop-search-results";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the Modempic catalog with USD pricing, clear labels, and secure crypto checkout.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getPublishedProducts(), listCategories()]);

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <div className="mt-3 grid gap-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Live catalog</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Shop</h1>
          <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
            Shop by category: <ShopCategoryIntroLinks categories={categories} />. Review each product label and
            documentation before ordering. See our{" "}
            <Link href="/shop/best-sellers" className="underline-offset-2 hover:underline">best sellers</Link>{" "}
            or read the <Link href="/blog" className="underline-offset-2 hover:underline">blog</Link>.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:min-w-72">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Products</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-[var(--foreground)]">{products.length}</dd>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Checkout</dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--foreground)]">Crypto-secure</dd>
          </div>
        </dl>
      </div>
      <Suspense fallback={<p className="mt-10 text-sm text-[var(--muted-foreground)]">Loading catalog...</p>}>
        <ShopSearchResults products={products} categories={categories} />
      </Suspense>
    </Container>
  );
}
