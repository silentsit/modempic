import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type HeroBottle = {
  slug: string;
  name: string;
  imageUrl: string;
};

type Slot = "left" | "center" | "right";

const SLOT_CLASS: Record<Slot, string> = {
  left: "hero-bottles-slot hero-bottles-left",
  center: "hero-bottles-slot hero-bottles-center",
  right: "hero-bottles-slot hero-bottles-right",
};

/** Front-most bottle is the desktop LCP element (largest painted area). */
const LCP_SLOT: Slot = "right";

const SLOT_SIZES: Record<Slot, string> = {
  left: "(min-width: 1024px) 140px, 0px",
  center: "(min-width: 1024px) 160px, 0px",
  right: "(min-width: 1024px) 200px, 0px",
};

const LCP_SRCSET_WIDTHS = [128, 256, 384] as const;

function slotsForCount(count: number): Slot[] {
  if (count >= 3) return ["left", "center", "right"];
  if (count === 2) return ["center", "right"];
  return ["right"];
}

function optimizerUrl(src: string, width: number) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}

function buildLcpSrcSet(src: string) {
  return LCP_SRCSET_WIDTHS.map((width) => `${optimizerUrl(src, width)} ${width}w`).join(", ");
}

/**
 * SwissChems-style overlapping product cluster: CSS rise on load, then a
 * staggered breathe (scale from the base). Decorative motion; each bottle
 * still links to its product page.
 */
export function HeroBottles({
  products,
  className,
}: {
  products: HeroBottle[];
  className?: string;
}) {
  if (products.length === 0) return null;

  const slots = slotsForCount(products.length);
  const lcpProduct = products[slots.indexOf(LCP_SLOT)];
  const lcpSrcSet = lcpProduct ? buildLcpSrcSet(lcpProduct.imageUrl) : null;

  return (
    <>
      {lcpProduct && lcpSrcSet ? (
        <link
          rel="preload"
          as="image"
          imageSrcSet={lcpSrcSet}
          imageSizes="200px"
          media="(min-width: 1024px)"
          fetchPriority="high"
        />
      ) : null}
      <div className={cn("hero-bottles hidden lg:block", className)} aria-label="Featured products">
        <div className="hero-bottles-stage">
          {slots.map((slot, index) => {
            const product = products[index];
            if (!product) return null;
            const isLcp = slot === LCP_SLOT;
            return (
              <Link
                key={product.slug}
                href={`/product/${product.slug}`}
                className={SLOT_CLASS[slot]}
                aria-label={product.name}
              >
                {isLcp && lcpSrcSet ? (
                  // Native picture: desktop source only. next/image preload has no media query
                  // and would fetch a stub on phones, where this cluster is hidden.
                  <picture>
                    <source media="(min-width: 1024px)" srcSet={lcpSrcSet} sizes="200px" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={product.name}
                      width={290}
                      height={650}
                      fetchPriority="high"
                      decoding="async"
                      className="hero-bottles-prod"
                      src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                    />
                  </picture>
                ) : (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={290}
                    height={650}
                    sizes={SLOT_SIZES[slot]}
                    loading="lazy"
                    fetchPriority="auto"
                    className="hero-bottles-prod"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
