import { getMostPurchasedProductSlug } from "@/lib/data/most-purchased-product";
import { getPublishedProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/shop/product-card";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function BestSellersSection() {
  const [all, mostPurchasedSlug] = await Promise.all([
    getPublishedProducts({ take: 8 }),
    getMostPurchasedProductSlug(),
  ]);
  const uniqueBySlug = [...new Map(all.map((p) => [p.slug, p])).values()];
  const display = uniqueBySlug.slice(0, 4);

  return (
    <section
      className="border-b border-[var(--border)] bg-white py-16 sm:py-20"
      id="bestsellers"
      aria-labelledby="bestsellers-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Popular picks</p>
          <h2 id="bestsellers-heading" className="mt-2 text-2xl font-semibold sm:text-3xl">
            Best selling products
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            Fast-scanning product cards with pack-size clarity, sale pricing where applicable, and a direct path to
            checkout or size selection.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {display.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              buyNowHref={`/checkout?buy=${encodeURIComponent(p.slug)}`}
              mostPurchasedSlug={mostPurchasedSlug}
            />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/shop/best-sellers">View all best sellers</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
