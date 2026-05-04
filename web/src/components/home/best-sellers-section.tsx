import { getPublishedProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/shop/product-card";
import { Container } from "@/components/site/container";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function BestSellersSection() {
  const all = await getPublishedProducts({ bestSellersOnly: true });
  const uniqueBySlug = [...new Map(all.map((p) => [p.slug, p])).values()];
  const display = uniqueBySlug.slice(0, 4);

  return (
    <section className="border-b border-[var(--border)] py-16 sm:py-20" id="bestsellers" aria-labelledby="bestsellers-heading">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="bestsellers-heading" className="text-2xl font-semibold sm:text-3xl">
              Best Sellingn Products
            </h2>
          </div>
          <Button variant="outline" asChild>
            <Link href="/shop/best-sellers">View all</Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {display.map((p) => (
            <ProductCard key={p.id} product={p} buyNowHref={`/checkout?buy=${encodeURIComponent(p.slug)}`} />
          ))}
        </div>
      </Container>
    </section>
  );
}
