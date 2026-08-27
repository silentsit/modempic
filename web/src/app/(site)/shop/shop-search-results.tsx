"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { titleCaseHeading } from "@/lib/text/heading-title-case";
import { prismaToStoreProduct } from "@/lib/catalog/prisma-to-store-product";
import type { Product, ProductImage } from "@prisma/client";

type ShopProduct = Product & {
  images: ProductImage[];
  categories: { category: { name: string; slug: string } }[];
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
  mostPurchasedSlug,
}: {
  products: ShopProduct[];
  mostPurchasedSlug?: string | null;
}) {
  const searchParams = useSearchParams();
  const query = normalizeQuery(searchParams.get("query"));
  const visibleProducts = query ? products.filter((product) => productMatchesQuery(product, query)) : products;

  return (
    <>
      {query ? (
        <div className="mt-8 rounded-2xl border border-border bg-card px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {titleCaseHeading(
              `${visibleProducts.length} result${visibleProducts.length === 1 ? "" : "s"} for “${query}”`,
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search results are filtered by product name, description, and category.{" "}
            <Link href="/shop" className="font-medium text-accent transition-colors hover:text-accent-hover hover:underline">
              Clear search
            </Link>
          </p>
        </div>
      ) : null}
      <div className="mt-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {titleCaseHeading(query ? "Search results" : "All products")}
        </h2>
        <p className="text-sm text-muted-foreground">
          Showing {visibleProducts.length} of {products.length}
        </p>
      </div>
      <ul className="mt-6 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProducts.map((product, index) => {
          const storeProduct = prismaToStoreProduct(product);
          return (
            <li key={storeProduct.id} className="h-full list-none">
              <ProductCard
                product={storeProduct}
                buyNowHref={`/checkout?buy=${encodeURIComponent(storeProduct.handle)}`}
                mostPurchasedSlug={mostPurchasedSlug}
                priority={index === 0}
              />
            </li>
          );
        })}
      </ul>
      {visibleProducts.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          No products matched your search. Try a broader term or{" "}
          <Link href="/shop" className="font-medium text-accent transition-colors hover:text-accent-hover hover:underline">
            clear your search
          </Link>
          .
        </p>
      ) : null}
    </>
  );
}
