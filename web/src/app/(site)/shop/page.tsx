import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedProducts, listCategories } from "@/lib/data/products";
import { ProductCard } from "@/components/shop/product-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse Modafinil, skin care, vitamins, cancer-support categories and more. USD pricing, clear labels.",
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
        <Link href="/shop/skin-care" className="underline-offset-2 hover:underline">skin care</Link>,{" "}
        <Link href="/shop/vitamins" className="underline-offset-2 hover:underline">vitamins</Link>, and{" "}
        <Link href="/shop/cancer" className="underline-offset-2 hover:underline">cancer-related supportive products</Link>.
        Always read the label and ask your clinician if you take medications. See our{" "}
        <Link href="/shop/best-sellers" className="underline-offset-2 hover:underline">best sellers</Link>{" "}
        or read the <Link href="/blog" className="underline-offset-2 hover:underline">blog</Link>.
      </p>
      {categories.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Categories">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/shop/${c.slug}`}
                className="inline-flex rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm font-medium transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="mt-10 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <li key={p.id} className="h-full list-none">
            <ProductCard product={p} buyNowHref={`/checkout?buy=${encodeURIComponent(p.slug)}`} />
          </li>
        ))}
      </ul>
    </Container>
  );
}
