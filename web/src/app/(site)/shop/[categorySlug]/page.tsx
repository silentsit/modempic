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
import { prismaToStoreProduct } from "@/lib/catalog/prisma-to-store-product";
import { catalogCategoryImageUrl } from "@/lib/related-catalog-links";
import Link from "next/link";
import { categoryLongformHtml } from "@/content/category-longform";
import { titleCaseHeading } from "@/lib/text/heading-title-case";

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
  const title = titleCaseHeading(cat.seoTitle ?? cat.name);
  const description = cat.seoDesc ?? cat.description ?? `Shop ${cat.name} at Modempic`;
  const imageUrl = catalogCategoryImageUrl(cat.slug);
  return {
    title,
    description,
    alternates: { canonical: `/shop/${categorySlug}` },
    openGraph: {
      title,
      description,
      url: `/shop/${categorySlug}`,
      type: "website",
      images: imageUrl ? [{ url: imageUrl, alt: cat.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
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
  const longformHtml = categoryLongformHtml(cat.slug);

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
        <div className="mt-6 grid gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Category</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {titleCaseHeading(cat.name)}
            </h1>
            {cat.description ? (
              <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">{cat.description}</p>
            ) : null}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:min-w-72">
            <div className="rounded-xl border border-border bg-muted p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Products</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{products.length}</dd>
            </div>
            <div className="rounded-xl border border-border bg-muted p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payments</dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">Crypto checkout</dd>
            </div>
          </dl>
        </div>
        <div className="mt-12 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {titleCaseHeading(`Products in ${cat.name}`)}
          </h2>
          <p className="text-sm text-muted-foreground">
            Showing {products.length} product{products.length === 1 ? "" : "s"}
          </p>
        </div>
        {products.length === 0 ? (
          <p className="mt-6 text-muted-foreground">No products in this category yet.</p>
        ) : (
          <>
            {products.length > 1 ? (
              <section
                className="mt-5 rounded-2xl border border-border bg-muted p-5"
                aria-label={`Compare ${cat.name} products`}
              >
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Compare in this category
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {products.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/product/${p.slug}`}
                        className="inline-flex rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <ul className="mt-6 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => {
                const storeProduct = prismaToStoreProduct(p);
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
          </>
        )}

        <section
          id="category-guide"
          hidden={!longformHtml}
          className={longformHtml ? "mt-14" : undefined}
          aria-label={`${cat.name} guide`}
        >
          {longformHtml ? (
            <div
              className="rounded-2xl border border-border bg-card p-6 sm:p-10"
              dangerouslySetInnerHTML={{ __html: longformHtml }}
            />
          ) : null}
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
    </>
  );
}
