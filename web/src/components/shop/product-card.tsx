import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/domain/money";
import { cn } from "@/lib/utils";
import type { Product, ProductImage } from "@prisma/client";

type CardProduct = Product & { images: ProductImage[] };

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
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-md",
        className,
      )}
    >
      <Link href={`/product/${product.slug}`} className="block aspect-[4/3] overflow-hidden bg-[var(--muted)]">
        {img ? (
          <Image
            src={img.url}
            alt={img.alt || product.name}
            width={400}
            height={300}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--muted-foreground)]">No image</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug">
          <Link href={`/product/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-[var(--muted-foreground)]">{product.shortDesc}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-semibold">{formatUsd(product.priceCents)}</span>
          {product.compareAtCents && product.compareAtCents > product.priceCents ? (
            <span className="text-sm text-[var(--muted-foreground)] line-through">{formatUsd(product.compareAtCents)}</span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:flex-1" asChild>
            <Link href={buyNowHref}>Buy now</Link>
          </Button>
          <Button variant="outline" className="w-full sm:flex-1" asChild>
            <Link href={`/product/${product.slug}`}>Details</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
