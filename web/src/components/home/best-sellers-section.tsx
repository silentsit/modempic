import { getMostPurchasedProductSlug } from "@/lib/data/most-purchased-product";
import { getPublishedProducts } from "@/lib/data/products";
import { prismaToStoreProduct } from "@/lib/catalog/prisma-to-store-product";
import { ProductCard } from "@/components/shop/product-card";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/home/reveal";
import Link from "next/link";

/**
 * TODO(cursor): getPublishedProducts() -> Medusa GET /store/products?is_featured=true
 * (or a "best-sellers" collection). ProductCard is the seam — its props should
 * accept the Product interface from types.ts (see /data/mock-product.ts).
 */
export async function BestSellersSection() {
  const [all, mostPurchasedSlug] = await Promise.all([
    getPublishedProducts({ take: 8 }),
    getMostPurchasedProductSlug(),
  ]);
  const uniqueBySlug = [...new Map(all.map((p) => [p.slug, p])).values()];
  const display = uniqueBySlug.slice(0, 4);

  return (
    <section
      className="border-b border-border bg-section-tint-primary py-16 sm:py-20"
      id="bestsellers"
      aria-labelledby="bestsellers-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge className="mx-auto">Popular picks</Badge>
          <h2 id="bestsellers-heading" className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Best Selling Products
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Fast-scanning product cards with pack-size clarity, sale pricing where applicable, and a direct path to
            checkout or size selection.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {display.map((p) => {
            const storeProduct = prismaToStoreProduct(p);
            return (
              <ProductCard
                key={storeProduct.id}
                product={storeProduct}
                buyNowHref={`/checkout?buy=${encodeURIComponent(storeProduct.handle)}`}
                mostPurchasedSlug={mostPurchasedSlug}
                className="shadow-[var(--shadow-card)]"
              />
            );
          })}
        </div>
        <div className="mt-12 flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/shop/best-sellers">View all best sellers</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
