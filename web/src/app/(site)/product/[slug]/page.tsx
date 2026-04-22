import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/data/products";
import { formatUsd } from "@/lib/domain/money";
import { Container } from "@/components/site/container";
import { AddToCartButtons } from "@/components/shop/add-to-cart";
import { getSiteUrl } from "@/lib/site-url";
import { ProductJsonLd } from "./json-ld";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product" };
  return {
    title: p.seoTitle ?? p.name,
    description: p.seoDesc ?? p.shortDesc,
    openGraph: p.images[0] ? { images: [{ url: p.images[0].url }] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const site = getSiteUrl();

  return (
    <>
      <ProductJsonLd product={product} baseUrl={site} />
      <Container className="py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-[var(--muted-foreground)]">
          <ol className="flex flex-wrap gap-1">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/shop" className="hover:underline">
                Shop
              </Link>
            </li>
            {product.categories[0] ? (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link href={`/shop/${product.categories[0].category.slug}`} className="hover:underline">
                    {product.categories[0].category.name}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden>/</li>
            <li className="text-[var(--foreground)]">{product.name}</li>
          </ol>
        </nav>
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--muted)]">
            {product.images[0] ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : null}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
            <p className="mt-3 text-lg text-[var(--muted-foreground)]">{product.shortDesc}</p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{formatUsd(product.priceCents)}</span>
              {product.compareAtCents && product.compareAtCents > product.priceCents ? (
                <span className="text-lg text-[var(--muted-foreground)] line-through">{formatUsd(product.compareAtCents)}</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">All prices in USD. Taxes and shipping may apply at checkout.</p>
            <div className="mt-8">
              <AddToCartButtons productId={product.id} />
            </div>
            {product.disclaimer ? (
              <p className="mt-8 text-xs text-[var(--muted-foreground)] leading-relaxed">{product.disclaimer}</p>
            ) : null}
            <div className="prose prose-neutral mt-10 max-w-none text-[var(--foreground)] dark:prose-invert prose-p:leading-relaxed">
              {product.longDesc.split("\n\n").map((para, i) => (
                <p key={i} className="whitespace-pre-wrap text-sm sm:text-base">
                  {para}
                </p>
              ))}
            </div>
            {product.reviews.length > 0 ? (
              <section className="mt-10 border-t border-[var(--border)] pt-8" aria-label="Customer reviews">
                <h2 className="text-lg font-semibold">Reviews</h2>
                <ul className="mt-4 space-y-4">
                  {product.reviews.map((r) => (
                    <li key={r.id} className="rounded-lg border border-[var(--border)] p-4">
                      <p className="text-sm font-medium">{r.rating} / 5</p>
                      {r.title ? <p className="mt-1 font-medium">{r.title}</p> : null}
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{r.body}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      </Container>
    </>
  );
}
