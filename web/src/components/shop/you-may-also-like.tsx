import Link from "next/link";
import type { Product, ProductImage } from "@prisma/client";
import { formatProductPriceDisplay, productHasSalePricing } from "@/lib/product-variants";
import { productImageDeliveryUrl } from "@/lib/cloudinary-delivery-url";
import { cn } from "@/lib/utils";

export type RecommendedProductCard = Product & {
  images: ProductImage[];
  avgRating: number;
  reviewCount: number;
};

function RecommendationStars({ averageRating, reviewCount }: { averageRating: number; reviewCount: number }) {
  const filled = reviewCount > 0 ? Math.min(5, Math.max(0, Math.round(averageRating))) : 0;

  return (
    <div
      className="flex justify-center gap-0.5 text-lg leading-none"
      aria-label={
        reviewCount > 0 ? `${averageRating.toFixed(1)} out of 5 stars, ${reviewCount} reviews` : "No ratings yet"
      }
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= filled ? "text-amber-400" : "text-neutral-300 dark:text-neutral-600"}>
          ★
        </span>
      ))}
    </div>
  );
}

export function YouMayAlsoLike({ products }: { products: RecommendedProductCard[] }) {
  if (products.length === 0) return null;

  return (
    <section
      className="mt-14 border-t border-[var(--border)] pt-12 sm:mt-16 sm:pt-14"
      aria-labelledby="you-may-also-like-heading"
    >
      <h2
        id="you-may-also-like-heading"
        className="text-center text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-left sm:text-2xl"
      >
        You may also like...
      </h2>
      <ul className="mt-8 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => {
          const img = p.images[0];
          const onSale = productHasSalePricing(p);
          const priceLabel = formatProductPriceDisplay(p);
          const buyHref = `/checkout?buy=${encodeURIComponent(p.slug)}`;

          return (
            <li key={p.id} className="list-none">
              <article
                className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md",
                )}
              >
                <Link href={`/product/${p.slug}`} className="relative block aspect-square overflow-hidden bg-[var(--muted)]">
                  {onSale ? (
                    <span className="absolute right-2 top-2 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-center text-[10px] font-bold uppercase leading-tight text-white shadow-md ring-2 ring-white/30">
                      Sale!
                    </span>
                  ) : null}
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element -- native img matches ProductCard / mixed URLs
                    <img
                      src={productImageDeliveryUrl(img.url, "card")}
                      alt={img.alt || p.name}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                      width={400}
                      height={400}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                      No image
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col items-center px-4 pb-4 pt-3 text-center">
                  <h3 className="font-bold leading-snug text-[var(--foreground)]">
                    <Link href={`/product/${p.slug}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </h3>
                  <div className="mt-2">
                    <RecommendationStars averageRating={p.avgRating} reviewCount={p.reviewCount} />
                  </div>
                  <p className="mt-2 text-base font-medium tabular-nums text-[var(--foreground)]">{priceLabel}</p>
                  <Link
                    href={buyHref}
                    className="mt-4 w-full rounded-md bg-emerald-700 px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  >
                    Buy now
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
