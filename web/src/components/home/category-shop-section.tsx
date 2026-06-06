import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/container";
import { listCategories } from "@/lib/data/products";
import { catalogCategoryImageUrl } from "@/lib/related-catalog-links";

export async function CategoryShopSection() {
  const categories = await listCategories();
  if (categories.length === 0) return null;

  return (
    <section className="border-b border-[var(--border)] bg-[var(--background)] py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Shop by category</p>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[var(--hero)]">
              Find the right catalog lane faster
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              Browse live product categories with clear pack options, USD pricing, and secure crypto checkout.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
          >
            View all products
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <ul className="mt-8 grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.slice(0, 6).map((category) => {
            const imageUrl = catalogCategoryImageUrl(category.slug);
            return (
              <li key={category.id} className="list-none">
                <Link
                  href={`/shop/${category.slug}`}
                  className="group flex h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="relative block h-auto w-28 shrink-0 overflow-hidden bg-[var(--muted)] sm:w-32">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- curated local category thumbnails
                      <img
                        src={imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                        loading="lazy"
                        decoding="async"
                        width={256}
                        height={256}
                      />
                    ) : (
                      <span className="flex h-full min-h-28 w-full items-center justify-center text-xs text-[var(--muted-foreground)]">
                        {category.name}
                      </span>
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col justify-center p-4">
                    <span className="font-semibold text-[var(--foreground)] group-hover:underline">{category.name}</span>
                    {category.description ? (
                      <span className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--muted-foreground)]">
                        {category.description}
                      </span>
                    ) : (
                      <span className="mt-1 text-sm text-[var(--muted-foreground)]">Browse products and pack sizes.</span>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                      Browse category
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
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
