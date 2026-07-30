import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCartForUser } from "@/lib/data/cart";
import { tierLabelForVariantKey } from "@/lib/cart-price";
import { formatUsd } from "@/lib/domain/money";
import { productImageDeliveryUrl } from "@/lib/cloudinary-delivery-url";
import { Container } from "@/components/site/container";
import { CheckoutProgress } from "@/app/(site)/checkout/checkout-progress";
import { CheckoutTrustStrip } from "@/app/(site)/checkout/checkout-trust-strip";
import { CartLineForm } from "./ui";
import { CartTrustAside } from "./cart-trust-aside";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/cart");
  const cart = await getCartForUser(session.user.id);
  const lines = cart?.items ?? [];

  const subtotal = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-col gap-6 border-b border-[var(--border)] pb-8 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your cart</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Review your lines, then continue to secure checkout.</p>
        </div>
        <div className="flex flex-col gap-4 sm:items-end">
          <CheckoutProgress current="cart" />
          <CheckoutTrustStrip />
        </div>
      </div>
      {lines.length === 0 ? (
        <p className="mt-6 text-[var(--muted-foreground)]">
          Your cart is empty.{" "}
          <Link href="/shop" className="text-[var(--primary)] hover:underline">
            Browse the shop
          </Link>
          .
        </p>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <ul className="space-y-6 lg:col-span-2">
            {lines.map((line) => {
              const img = line.product.images[0];
              const variantLabel = tierLabelForVariantKey(line.product, line.variantKey, line.variant);
              return (
                <li key={line.id} className="flex gap-4 rounded-2xl border border-[var(--border)] p-4">
                  <Link href={`/product/${line.product.slug}`} className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[var(--muted)]">
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
                    <Link href={`/product/${line.product.slug}`} className="font-medium hover:underline">
                      {line.product.name}
                    </Link>
                    {variantLabel ? (
                      <p className="text-sm text-[var(--muted-foreground)]">{variantLabel}</p>
                    ) : null}
                    <p className="text-sm text-[var(--muted-foreground)]">{formatUsd(line.unitPriceCents)} each</p>
                    <CartLineForm lineId={line.id} quantity={line.quantity} />
                  </div>
                </li>
              );
            })}
          </ul>
          <CartTrustAside subtotalCents={subtotal} />
        </div>
      )}
    </Container>
  );
}
