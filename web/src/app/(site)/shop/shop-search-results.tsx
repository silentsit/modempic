"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { prismaToStoreProduct } from "@/lib/catalog/prisma-to-store-product";
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
  mostPurchasedSlug,
}: {
  products: ShopProduct[];
  categories: ShopCategory[];
  mostPurchasedSlug?: string | null;
}) {
  const searchParams = useSearchParams();
  const query = normalizeQuery(searchParams.get("query"));
  const visibleProducts = query ? products.filter((product) => productMatchesQuery(product, query)) : products;

  return (
    <>
      <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {products.length} product{products.length === 1 ? "" : "s"} available
            </p>
            <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">Find products faster</h2>
          </div>
          <form action="/shop" className="flex w-full max-w-xl flex-col gap-2 sm:flex-row" role="search">
            <label htmlFor="shop-search" className="sr-only">
              Search products
            </label>
            <input
              id="shop-search"
              name="query"
              type="search"
              defaultValue={query}
              placeholder="Search products"
              className="min-h-11 flex-1 rounded-full border border-input bg-background px-4 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background sm:text-sm"
            />
            <button
              type="submit"
              className="min-h-11 w-full rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
            >
              Search
            </button>
          </form>
        </div>
        {categories.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Categories">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/shop/${category.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      {query ? (
        <div className="mt-8 rounded-2xl border border-border bg-card px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {visibleProducts.length} result{visibleProducts.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search results are filtered by product name, description, and category.{" "}
            <Link href="/shop" className="font-medium text-accent transition-colors hover:text-accent-hover hover:underline">
              Clear search
            </Link>
          </p>
        </div>
      ) : null}
      <div className="mt-10 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {query ? "Search results" : "All products"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Showing {visibleProducts.length} of {products.length}
        </p>
      </div>
      <ul className="mt-6 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProducts.map((product) => {
          const storeProduct = prismaToStoreProduct(product);
          return (
            <li key={storeProduct.id} className="h-full list-none">
              <ProductCard
                product={storeProduct}
                buyNowHref={`/checkout?buy=${encodeURIComponent(storeProduct.handle)}`}
                mostPurchasedSlug={mostPurchasedSlug}
              />
            </li>
          );
        })}
      </ul>
      {visibleProducts.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          No products matched your search. Try a broader term or browse all categories above.
        </p>
      ) : null}
    </>
  );
}
