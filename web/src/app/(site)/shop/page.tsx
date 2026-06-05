import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedProducts, listCategories } from "@/lib/data/products";
import { ProductCard } from "@/components/shop/product-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Container } from "@/components/site/container";

type Search = { query?: string };

function normalizeQuery(query?: string) {
  return query?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "";
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const query = normalizeQuery((await searchParams).query);
  return {
    title: query ? `Search results for "${query}"` : "Shop",
    description: query
      ? `Search Modempic products for ${query}.`
      : "Browse Modafinil, peptides, skin care, antiparasitic, and more. USD pricing, clear labels.",
    alternates: { canonical: "/shop" },
    ...(query ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = normalizeQuery((await searchParams).query);
  const [products, categories] = await Promise.all([getPublishedProducts(), listCategories()]);
  const queryLower = query.toLowerCase();
  const visibleProducts = query
    ? products.filter((p) => {
        const searchable = [
          p.name,
          p.shortDesc,
          p.longDesc,
          ...p.categories.map((pc) => pc.category.name),
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(queryLower);
      })
    : products;

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Shop</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
        Shop by category: <Link href="/shop/modafinil" className="underline-offset-2 hover:underline">Modafinil</Link>,{" "}
        <Link href="/shop/peptides" className="underline-offset-2 hover:underline">peptides</Link>,{" "}
        <Link href="/shop/skin-care" className="underline-offset-2 hover:underline">skin care</Link>,{" "}
        <Link href="/shop/antiparasitic" className="underline-offset-2 hover:underline">antiparasitic</Link>, and{" "}
        <Link href="/shop/cancer" className="underline-offset-2 hover:underline">cancer-related supportive products</Link>.
        Always read the label and ask your clinician if you take medications. See our{" "}
        <Link href="/shop/best-sellers" className="underline-offset-2 hover:underline">best sellers</Link>{" "}
        or read the <Link href="/blog" className="underline-offset-2 hover:underline">blog</Link>.
      </p>
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
      {query ? (
        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4">
          <h2 className="text-lg font-semibold">
            {visibleProducts.length} result{visibleProducts.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Search results are filtered by product name, description, and category.
            {" "}
            <Link href="/shop" className="font-medium text-[var(--primary)] hover:underline">
              Clear search
            </Link>
          </p>
        </div>
      ) : null}
      <ul className="mt-10 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProducts.map((p) => (
          <li key={p.id} className="h-full list-none">
            <ProductCard product={p} buyNowHref={`/checkout?buy=${encodeURIComponent(p.slug)}`} />
          </li>
        ))}
      </ul>
      {visibleProducts.length === 0 ? (
        <p className="mt-8 text-[var(--muted-foreground)]">
          No products matched your search. Try a broader term or browse all categories above.
        </p>
      ) : null}
    </Container>
  );
}
