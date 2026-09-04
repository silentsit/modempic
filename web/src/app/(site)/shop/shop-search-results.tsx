import Link from "next/link";
import { ProductCard } from "@/components/shop/product-card";
import { titleCaseHeading } from "@/lib/text/heading-title-case";
import type { Product } from "@/types";

export function ShopSearchResults({
  products,
  catalogCount,
  query,
  mostPurchasedSlug,
}: {
  products: Product[];
  catalogCount: number;
  query: string;
  mostPurchasedSlug?: string | null;
}) {
  return (
    <>
      {query ? (
        <div className="mt-8 rounded-2xl border border-border bg-card px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {titleCaseHeading(`${products.length} result${products.length === 1 ? "" : "s"} for “${query}”`)}
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
          Showing {products.length} of {catalogCount}
        </p>
      </div>
      <ul className="mt-6 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <li key={product.id} className="h-full list-none">
            <ProductCard
              product={product}
              buyNowHref={`/checkout?buy=${encodeURIComponent(product.handle)}`}
              mostPurchasedSlug={mostPurchasedSlug}
              priority={index === 0}
            />
          </li>
        ))}
      </ul>
      {products.length === 0 ? (
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
