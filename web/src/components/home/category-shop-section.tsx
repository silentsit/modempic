import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/container";
import { listCategories } from "@/lib/data/products";
import { catalogCategoryImageUrl } from "@/lib/related-catalog-links";

/**
 * TODO(cursor): listCategories() returns the Prisma-era shape ({ id, slug, name,
 * description }). Medusa's ProductCategory maps 1:1 onto the Category interface
 * in types.ts (slug -> handle) — swap the data source, keep the markup.
 */
export async function CategoryShopSection() {
  const categories = await listCategories();
  if (categories.length === 0) return null;

  return (
    <section
      className="border-b border-border bg-background py-16 sm:py-20"
      aria-labelledby="categories-heading"
    >
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Shop by category</p>
            <h2 id="categories-heading" className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Find the right catalog lane faster
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Browse live product categories with clear pack options, USD pricing, and secure crypto checkout.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            View all products
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <ul className="mt-10 grid list-none gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.slice(0, 6).map((category) => {
            const imageUrl = catalogCategoryImageUrl(category.slug);
            return (
              <li key={category.id} className="list-none">
                <Link
                  href={`/shop/${category.slug}`}
                  className="group flex h-full overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
                >
                  <span className="relative block h-auto w-28 shrink-0 overflow-hidden bg-muted sm:w-32">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- curated local category thumbnails
                      <img
                        src={imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        decoding="async"
                        width={256}
                        height={256}
                      />
                    ) : (
                      <span className="flex h-full min-h-28 w-full items-center justify-center text-xs text-muted-foreground">
                        {category.name}
                      </span>
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col justify-center p-5">
                    <span className="font-semibold text-foreground transition-colors group-hover:text-primary">
                      {category.name}
                    </span>
                    {category.description ? (
                      <span className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {category.description}
                      </span>
                    ) : (
                      <span className="mt-1.5 text-sm text-muted-foreground">Browse products and pack sizes.</span>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-primary">
                      Browse category
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
