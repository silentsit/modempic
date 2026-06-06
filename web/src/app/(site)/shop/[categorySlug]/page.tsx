import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMostPurchasedProductSlug } from "@/lib/data/most-purchased-product";
import { getCategoryBySlug, getCategorySlugs, listCategories } from "@/lib/data/products";
import { ProductCard } from "@/components/shop/product-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FeaturedBlogPosts } from "@/components/blog/featured-blog-posts";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { isStorefrontCategoryVisible } from "@/lib/catalog/category-visibility";
import { catalogCategoryImageUrl } from "@/lib/related-catalog-links";
import Link from "next/link";
import { categorySeoContent } from "@/content/category-clusters";

type Props = { params: Promise<{ categorySlug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await getCategorySlugs();
  return categories.map((category) => ({ categorySlug: category.slug }));
}

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
  if (!isStorefrontCategoryVisible(categorySlug)) notFound();
  const [cat, allCategories, mostPurchasedSlug] = await Promise.all([
    getCategoryBySlug(categorySlug),
    listCategories(),
    getMostPurchasedProductSlug(),
  ]);
  if (!cat) notFound();

  const products = cat.products
    .map((pc) => pc.product)
    .sort((a, b) => a.name.localeCompare(b.name));

  const otherCategories = allCategories.filter((c) => c.slug !== categorySlug);
  const seoContent = categorySeoContent(cat.slug, cat.name);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seoContent.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <Container className="py-10 sm:py-14">
        <Breadcrumbs
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: cat.name },
          ]}
        />
        <div className="mt-3 grid gap-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Category</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{cat.name}</h1>
            <div className="mt-3 max-w-3xl space-y-3 text-[var(--muted-foreground)]">
              {cat.description ? <p>{cat.description}</p> : null}
              <p>{seoContent.intro}</p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:min-w-72">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Products</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-[var(--foreground)]">{products.length}</dd>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Payments</dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--foreground)]">Crypto checkout</dd>
            </div>
          </dl>
        </div>
        <div className="mt-10 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Products in {cat.name}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Showing {products.length} product{products.length === 1 ? "" : "s"}
          </p>
        </div>
        {products.length === 0 ? (
          <p className="mt-6 text-[var(--muted-foreground)]">No products in this category yet.</p>
        ) : (
          <>
            {products.length > 1 ? (
              <section
                className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5"
                aria-label={`Compare ${cat.name} products`}
              >
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Compare in this category
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {products.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/product/${p.slug}`}
                        className="inline-flex rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <ul className="mt-5 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <li key={p.id} className="h-full list-none">
                  <ProductCard
                    product={p}
                    buyNowHref={`/checkout?buy=${encodeURIComponent(p.slug)}`}
                    mostPurchasedSlug={mostPurchasedSlug}
                  />
                </li>
              ))}
            </ul>
          </>
        )}

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-[var(--hero)]">
            About {cat.name} catalog items
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">{seoContent.support}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2" aria-label={`${cat.name} category questions`}>
            {seoContent.faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{faq.q}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <FeaturedBlogPosts heading="Related reading" />

        <RelatedLinks
          heading="Browse other categories"
          links={otherCategories.map((c) => ({
            href: `/shop/${c.slug}`,
            label: c.name,
            description: c.description ?? undefined,
            imageUrl: catalogCategoryImageUrl(c.slug),
            imageAlt: c.name,
          }))}
        />
      </Container>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
