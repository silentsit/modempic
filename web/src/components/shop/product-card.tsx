import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/domain/money";
import { filterVisibleCategorySlugs } from "@/lib/catalog/category-visibility";
import {
  formatProductPriceDisplay,
  parseVariantTiers,
  productHeadlineCompareStrikeCents,
  productShowsStorefrontSaleBadge,
} from "@/lib/product-variants";
import { storefrontShortDesc } from "@/lib/product-short-desc";
import { productImageDeliveryUrl } from "@/lib/cloudinary-delivery-url";
import { cn } from "@/lib/utils";
import type { Product, ProductImage } from "@prisma/client";

type CardProduct = Product & {
  images: ProductImage[];
  categories?: { category: { name?: string; slug: string } }[];
};

export function ProductCard({
  product,
  buyNowHref,
  className,
}: {
  product: CardProduct;
  /** e.g. /checkout?buy=slug for direct-to-checkout (requires auth on checkout) */
  buyNowHref: string;
  className?: string;
}) {
  const img = product.images[0];
  const headlineCompare = productHeadlineCompareStrikeCents(product);
  const priceLabel = formatProductPriceDisplay(product);
  const showSaleBadge = productShowsStorefrontSaleBadge(product);
  const tierCount = parseVariantTiers(product.variants).length;
  const hasPackChoices = tierCount > 1;
  const primaryHref = hasPackChoices ? `/product/${product.slug}` : buyNowHref;
  const primaryLabel = hasPackChoices ? "Choose size" : "Buy now";
  const visibleCategories = product.categories
    ? filterVisibleCategorySlugs(product.categories.map((row) => row.category))
    : [];
  const firstCategory = visibleCategories[0];
  const signalBadges = [...(tierCount > 1 ? [`${tierCount} pack sizes`] : [])]
    .filter((badge): badge is string => Boolean(badge?.trim()))
    .slice(0, 3);

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-md",
        className,
      )}
    >
      <Link href={`/product/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-white p-1.5 sm:p-2">
        {firstCategory?.name ? (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[var(--foreground)] shadow-sm ring-1 ring-black/5">
            {firstCategory.name}
          </span>
        ) : null}
        {showSaleBadge ? (
          <span
            className="absolute right-2 top-2 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-center text-xs font-bold uppercase leading-tight text-white shadow-md ring-2 ring-white/30"
            aria-hidden
          >
            SALE
          </span>
        ) : null}
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element -- native img avoids Next/Image optimizer edge cases on mixed/local URLs
          <img
            src={productImageDeliveryUrl(img.url, "card")}
            alt={img.alt || product.name}
            className="h-full w-full object-contain transition-transform group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
            width={400}
            height={300}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--muted-foreground)]">No image</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug text-[var(--foreground)]">
          <Link href={`/product/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-[var(--muted-foreground)]">
          {storefrontShortDesc(product.shortDesc)}
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Product signals">
          {signalBadges.map((badge) => (
            <li
              key={badge}
              className="rounded-full border border-[var(--border)] bg-[var(--muted)]/50 px-2 py-1 text-[11px] font-medium text-[var(--muted-foreground)]"
            >
              {badge}
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {hasPackChoices ? "From" : "Price"}
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-lg font-semibold tabular-nums text-[var(--foreground)]">{priceLabel}</span>
            {headlineCompare != null ? (
              <span className="text-sm text-[var(--muted-foreground)] line-through">{formatUsd(headlineCompare)}</span>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:flex-1" asChild>
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button variant="outline" className="w-full sm:flex-1" asChild>
            <Link href={`/product/${product.slug}`}>Details</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
