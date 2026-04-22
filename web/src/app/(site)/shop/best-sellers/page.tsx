import type { Metadata } from "next";
import { getPublishedProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/shop/product-card";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "Best sellers",
  description: "Our most-purchased supplements and wellness products in USD.",
};

export default async function BestSellersPage() {
  const products = await getPublishedProducts({ bestSellersOnly: true });

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Best sellers</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">Popular picks from our community—same clear labels, fair pricing.</p>
      <ul className="mt-10 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <li key={p.id} className="h-full list-none">
            <ProductCard product={p} buyNowHref={`/checkout?buy=${encodeURIComponent(p.slug)}`} />
          </li>
        ))}
      </ul>
    </Container>
  );
}
