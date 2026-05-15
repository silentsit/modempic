import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, listCategories } from "@/lib/data/products";
import { ProductCard } from "@/components/shop/product-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { catalogCategoryImageUrl } from "@/lib/related-catalog-links";

type Props = { params: Promise<{ categorySlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const cat = await getCategoryBySlug(categorySlug);
  if (!cat) return { title: "Category" };
  return {
    title: cat.seoTitle ?? `${cat.name} | Shop`,
    description: cat.seoDesc ?? cat.description ?? `Shop ${cat.name} at Modempic`,
    alternates: { canonical: `/shop/${categorySlug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const [cat, allCategories] = await Promise.all([getCategoryBySlug(categorySlug), listCategories()]);
  if (!cat) notFound();

  const products = cat.products
    .map((pc) => pc.product)
    .sort((a, b) => a.name.localeCompare(b.name));

  const otherCategories = allCategories.filter((c) => c.slug !== categorySlug);

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: cat.name },
        ]}
      />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{cat.name}</h1>
      {cat.description ? <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">{cat.description}</p> : null}
      {products.length === 0 ? (
        <p className="mt-8 text-[var(--muted-foreground)]">No products in this category yet.</p>
      ) : (
        <ul className="mt-10 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li key={p.id} className="h-full list-none">
              <ProductCard product={p} buyNowHref={`/checkout?buy=${encodeURIComponent(p.slug)}`} />
            </li>
          ))}
        </ul>
      )}

      <RelatedLinks
        heading="Browse other categories"
        links={[
          ...otherCategories.map((c) => ({
            href: `/shop/${c.slug}`,
            label: c.name,
            description: c.description ?? undefined,
            imageUrl: catalogCategoryImageUrl(c.slug),
            imageAlt: c.name,
          })),
          {
            href: "/shop/best-sellers",
            label: "Best sellers",
            description: "Most-purchased picks across the catalog.",
            imageUrl: catalogCategoryImageUrl("best-sellers"),
            imageAlt: "Best sellers",
          },
          { href: "/shop", label: "All products", description: "View the full Modempic shop." },
        ]}
      />
    </Container>
  );
}
