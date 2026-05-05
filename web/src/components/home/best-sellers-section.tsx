import Link from "next/link";
import { getPublishedProducts, listCategories } from "@/lib/data/products";
import { ProductCard } from "@/components/shop/product-card";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";

export async function BestSellersSection() {
  const [all, categories] = await Promise.all([
    getPublishedProducts({ take: 8 }),
    listCategories(),
  ]);
  const uniqueBySlug = [...new Map(all.map((p) => [p.slug, p])).values()];
  const display = uniqueBySlug.slice(0, 4);

  return (
    <section className="border-b border-[var(--border)] py-16 sm:py-20" id="bestsellers" aria-labelledby="bestsellers-heading">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="bestsellers-heading" className="text-2xl font-semibold sm:text-3xl">
              Best Selling Products
            </h2>
            <p className="mt-1 text-[var(--muted-foreground)]">
              Customer favourites, clearly labelled and fairly priced.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/shop/best-sellers">View all best sellers</Link>
          </Button>
        </div>

        {categories.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Shop by category">
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

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {display.map((p) => (
            <ProductCard key={p.id} product={p} buyNowHref={`/checkout?buy=${encodeURIComponent(p.slug)}`} />
          ))}
        </div>
      </Container>
    </section>
  );
}
