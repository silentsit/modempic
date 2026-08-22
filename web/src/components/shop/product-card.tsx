import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/domain/money";
import { ProductCornerBadge } from "@/components/shop/product-corner-badge";
import {
  productHeadlineCompareStrikeCents,
  resolveStorefrontCornerBadge,
  type StorefrontCornerBadge,
} from "@/lib/product-variants";
import { cn } from "@/lib/utils";
import { titleCaseHeading } from "@/lib/text/heading-title-case";
import type { Product } from "@/types";

/** Lowest current price across variants (cents). */
function minPriceCents(product: Product): number | null {
  const amounts = product.variants.flatMap((v) => v.prices.map((p) => p.amount));
  return amounts.length > 0 ? Math.min(...amounts) : null;
}

function prismaPricingFields(product: Product): {
  slug: string;
  priceCents: number;
  compareAtCents: number | null;
  variants: unknown;
} {
  const meta = product.metadata ?? {};
  const fromVariants = product.variants.map((v) => ({
    label: v.title,
    priceCents: v.prices[0]?.amount ?? 0,
    compareAtCents:
      v.prices[0]?.original_amount != null &&
      v.prices[0].original_amount > (v.prices[0]?.amount ?? 0)
        ? v.prices[0].original_amount
        : undefined,
  }));
  const priceCents =
    typeof meta.priceCents === "number" ? meta.priceCents : (minPriceCents(product) ?? 0);
  const compareAtCents = typeof meta.compareAtCents === "number" ? meta.compareAtCents : null;
  return {
    slug: product.handle,
    priceCents,
    compareAtCents,
    // Prefer live adapted variants; metadata is a fallback for older callers
    variants: fromVariants.length > 0 ? fromVariants : (meta.variantsJson ?? null),
  };
}

function resolveCornerBadge(product: Product, mostPurchasedSlug?: string | null): StorefrontCornerBadge | null {
  return resolveStorefrontCornerBadge(prismaPricingFields(product), mostPurchasedSlug);
}

export function ProductCard({
  product,
  buyNowHref,
  mostPurchasedSlug,
  className,
}: {
  product: Product;
  /** e.g. /checkout?buy=<handle> for direct-to-checkout (requires auth on checkout) */
  buyNowHref: string;
  /** Handle of the top-selling product; shows Best Seller badge in place of Sale. */
  mostPurchasedSlug?: string | null;
  className?: string;
}) {
  const img = product.images[0] ?? null;
  const imgUrl = img?.url ?? product.thumbnail;
  const priceCents = minPriceCents(product);
  const pricing = prismaPricingFields(product);
  const headlineCompare = productHeadlineCompareStrikeCents(pricing);
  const cornerBadge = resolveCornerBadge(product, mostPurchasedSlug);
  const tierCount = product.variants.length;
  const hasPackChoices = tierCount > 1;
  const primaryHref = hasPackChoices ? `/product/${product.handle}` : buyNowHref;
  const primaryLabel = hasPackChoices ? "Choose size" : "Buy now";
  const firstCategory = product.categories[0] ?? null;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40",
        className,
      )}
    >
      <Link href={`/product/${product.handle}`} className="relative block aspect-[4/3] overflow-hidden bg-background p-2">
        {firstCategory ? (
          <span className="absolute left-3 top-3 z-10 max-w-[55%] truncate rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {firstCategory.name}
          </span>
        ) : null}
        {cornerBadge ? <ProductCornerBadge variant={cornerBadge} /> : null}
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- native img avoids Next/Image optimizer edge cases on mixed/local URLs
          <img
            src={imgUrl}
            alt={img?.alt || product.title}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
            width={400}
            height={300}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold leading-snug tracking-tight text-foreground">
          <Link href={`/product/${product.handle}`} className="transition-colors hover:text-primary">
            {titleCaseHeading(product.title)}
          </Link>
        </h3>
        {product.description ? (
          <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        ) : null}

        <div className="mt-4 rounded-xl border border-border bg-muted px-3.5 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {hasPackChoices ? "From" : "Price"}
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {priceCents != null ? formatUsd(priceCents) : "—"}
            </span>
            {headlineCompare != null ? (
              <span className="text-sm text-muted-foreground line-through">{formatUsd(headlineCompare)}</span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:flex-1" asChild>
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button variant="outline" className="w-full sm:flex-1" asChild>
            <Link href={`/product/${product.handle}`}>Details</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
