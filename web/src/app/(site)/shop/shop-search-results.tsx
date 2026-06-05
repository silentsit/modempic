"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import type { Product, ProductImage } from "@prisma/client";

type ShopProduct = Product & {
  images: ProductImage[];
  categories: { category: { name: string; slug: string } }[];
};

type ShopCategory = {
  id: string;
  name: string;
  slug: string;
};

function normalizeQuery(query?: string | null) {
  return query?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "";
}

function productMatchesQuery(product: ShopProduct, query: string) {
  const searchable = [
    product.name,
    product.shortDesc,
    product.longDesc,
    ...product.categories.map((pc) => pc.category.name),
  ]
    .join(" ")
    .toLowerCase();
  return searchable.includes(query.toLowerCase());
}

export function ShopSearchResults({
  products,
  categories,
}: {
  products: ShopProduct[];
  categories: ShopCategory[];
}) {
  const searchParams = useSearchParams();
  const query = normalizeQuery(searchParams.get("query"));
  const visibleProducts = query ? products.filter((product) => productMatchesQuery(product, query)) : products;

  return (
    <>
      <form action="/shop" className="mt-6 flex max-w-xl gap-2" role="search">
        <label htmlFor="shop-search" className="sr-only">
          Search products
        </label>
        <input
          id="shop-search"
          name="query"
          type="search"
          defaultValue={query}
          placeholder="Search products"
          className="min-h-11 flex-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-sm outline-none transition-colors focus:border-[var(--primary)]"
        />
        <button
          type="submit"
          className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
        >
          Search
        </button>
      </form>
      {categories.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Categories">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/shop/${category.slug}`}
                className="inline-flex rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm font-medium transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {query ? (
        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4">
          <h2 className="text-lg font-semibold">
            {visibleProducts.length} result{visibleProducts.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Search results are filtered by product name, description, and category.{" "}
            <Link href="/shop" className="font-medium text-[var(--primary)] hover:underline">
              Clear search
            </Link>
          </p>
        </div>
      ) : null}
      <ul className="mt-10 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProducts.map((product) => (
          <li key={product.id} className="h-full list-none">
            <ProductCard product={product} buyNowHref={`/checkout?buy=${encodeURIComponent(product.slug)}`} />
          </li>
        ))}
      </ul>
      {visibleProducts.length === 0 ? (
        <p className="mt-8 text-[var(--muted-foreground)]">
          No products matched your search. Try a broader term or browse all categories above.
        </p>
      ) : null}
    </>
  );
}
