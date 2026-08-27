import type { Metadata } from "next";
import Link from "next/link";
import { getCartForOwner } from "@/lib/data/cart";
import { tierLabelForVariantKey } from "@/lib/cart-price";
import { formatUsd } from "@/lib/domain/money";
import { productImageDeliveryUrl } from "@/lib/cloudinary-delivery-url";
import { Container } from "@/components/site/container";
import { FreeShippingProgressBar } from "@/components/cart/free-shipping-progress-bar";
import { CheckoutProgress } from "@/app/(site)/checkout/checkout-progress";
import { CheckoutTrustStrip } from "@/app/(site)/checkout/checkout-trust-strip";
import { CartLineForm } from "./ui";
import { CartTrustAside } from "./cart-trust-aside";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const cart = await getCartForOwner();
  const lines = cart?.items ?? [];

  const subtotal = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-col gap-6 border-b border-border pb-10 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Your Cart</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review your lines, then continue to secure checkout.</p>
        </div>
        <div className="flex flex-col gap-4 sm:items-end">
          <CheckoutProgress current="cart" />
          <CheckoutTrustStrip />
        </div>
      </div>
      {lines.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <p className="text-lg font-medium text-foreground">Your cart is empty</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse{" "}
            <Link href="/shop" className="font-medium text-accent transition-colors hover:text-accent-hover hover:underline">
              all products
            </Link>
            ,{" "}
            <Link href="/shop/best-sellers" className="font-medium text-accent transition-colors hover:text-accent-hover hover:underline">
              best sellers
            </Link>
            , or{" "}
            <Link href="/shop/nootropics" className="font-medium text-accent transition-colors hover:text-accent-hover hover:underline">
              Nootropics
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 max-w-3xl lg:hidden">
            <FreeShippingProgressBar subtotalAfterDiscountCents={subtotal} showContinueShopping />
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-12">
          <ul className="space-y-5 lg:col-span-2">
            {lines.map((line) => {
              const img = line.product.images[0];
              const variantLabel = tierLabelForVariantKey(line.product, line.variantKey, line.variant);
              return (
                <li key={line.id} className="flex gap-5 rounded-2xl border border-border bg-card p-5">
                  <Link
                    href={`/product/${line.product.slug}`}
                    className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={productImageDeliveryUrl(img.url, "cartThumb")}
                        alt={img.alt || line.product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width={96}
                        height={96}
                      />
                    ) : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${line.product.slug}`}
                      className="font-medium text-foreground transition-colors hover:text-accent"
                    >
                      {line.product.name}
                    </Link>
                    {variantLabel ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">{variantLabel}</p>
                    ) : null}
                    <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
                      {formatUsd(line.unitPriceCents)} each
                    </p>
                    <CartLineForm lineId={line.id} quantity={line.quantity} />
                  </div>
                </li>
              );
            })}
          </ul>
          <CartTrustAside subtotalCents={subtotal} />
        </div>
        </>
      )}
    </Container>
  );
}
