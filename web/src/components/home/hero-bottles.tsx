import Image from "next/image";
import Link from "next/link";
import { productImageDeliveryUrl } from "@/lib/cloudinary-delivery-url";

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

function slotsForCount(count: number): Slot[] {
  if (count >= 3) return ["left", "center", "right"];
  if (count === 2) return ["center", "right"];
  return ["right"];
}

/**
 * SwissChems-style overlapping product cluster: CSS rise on load, then a
 * staggered breathe (scale from the base). Decorative motion; each bottle
 * still links to its product page.
 */
export function HeroBottles({ products }: { products: HeroBottle[] }) {
  if (products.length === 0) return null;

  const slots = slotsForCount(products.length);

  return (
    <div className="hero-bottles" aria-label="Featured products">
      <div className="hero-bottles-stage">
        {slots.map((slot, index) => {
          const product = products[index];
          if (!product) return null;
          const src = productImageDeliveryUrl(product.imageUrl, "card");
          return (
            <Link
              key={product.slug}
              href={`/product/${product.slug}`}
              className={SLOT_CLASS[slot]}
              aria-label={product.name}
            >
              <Image
                src={src}
                alt=""
                width={644}
                height={900}
                priority={slot === "right"}
                sizes="(max-width: 1024px) 40vw, 22rem"
                className="hero-bottles-prod"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
