import type { Metadata } from "next";
import Link from "next/link";
import { getMostPurchasedProductSlug } from "@/lib/data/most-purchased-product";
import { getPublishedProducts, listCategories } from "@/lib/data/products";
import { ShopCategoryIntroLinks } from "@/lib/shop-category-links";
import { ProductCard } from "@/components/shop/product-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Container } from "@/components/site/container";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Best sellers",
  description: "Most-purchased Modempic catalog items with clear labels and USD pricing.",
  alternates: { canonical: "/shop/best-sellers" },
};

export default async function BestSellersPage() {
  const [products, categories, mostPurchasedSlug] = await Promise.all([
    getPublishedProducts({ bestSellersOnly: true }),
    listCategories(),
    getMostPurchasedProductSlug(),
  ]);

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: "Best sellers" },
        ]}
      />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Best sellers</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
        Popular catalog items with the same clear labels and fair pricing. See all{" "}
        <Link href="/shop" className="underline-offset-2 hover:underline">products</Link>{" "}
        or browse <ShopCategoryIntroLinks categories={categories} />.
      </p>
      <ul className="mt-10 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <li key={p.id} className="h-full list-none">
            <ProductCard
              product={p}
              buyNowHref={`/checkout?buy=${encodeURIComponent(p.slug)}`}
              mostPurchasedSlug={mostPurchasedSlug}
            />
          </li>
        ))}
      </ul>
    </Container>
  );
}
