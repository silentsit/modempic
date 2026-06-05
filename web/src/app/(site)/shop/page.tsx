import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getPublishedProducts, listCategories } from "@/lib/data/products";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Container } from "@/components/site/container";
import { ShopSearchResults } from "./shop-search-results";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the Modempic catalog with USD pricing, clear labels, research-use notices, and secure checkout.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getPublishedProducts(), listCategories()]);

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Shop</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
        Shop by category: <Link href="/shop/modafinil" className="underline-offset-2 hover:underline">Modafinil</Link>,{" "}
        <Link href="/shop/peptides" className="underline-offset-2 hover:underline">peptides</Link>,{" "}
        <Link href="/shop/skin-care" className="underline-offset-2 hover:underline">skin care</Link>,{" "}
        <Link href="/shop/antiparasitic" className="underline-offset-2 hover:underline">antiparasitic</Link>, and{" "}
        <Link href="/shop/cancer" className="underline-offset-2 hover:underline">specialty catalog items</Link>.
        Review each product label, documentation, and research-use notice before ordering. See our{" "}
        <Link href="/shop/best-sellers" className="underline-offset-2 hover:underline">best sellers</Link>{" "}
        or read the <Link href="/blog" className="underline-offset-2 hover:underline">blog</Link>.
      </p>
      <Suspense fallback={<p className="mt-10 text-sm text-[var(--muted-foreground)]">Loading catalog...</p>}>
        <ShopSearchResults products={products} categories={categories} />
      </Suspense>
    </Container>
  );
}
