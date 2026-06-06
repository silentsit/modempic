"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { tierLabelForVariantKey } from "@/lib/cart-price";
import type { VariantTierSource } from "@/lib/catalog/product-variant-store";
import { formatUsd } from "@/lib/domain/money";
import { productImageDeliveryUrl } from "@/lib/cloudinary-delivery-url";
import { checkoutShippingMethodLabel } from "@/lib/domain/checkout-pricing";
import { CHECKOUT_FORM_ID } from "./checkout-form-id";

const promoInputCls =
  "mt-1.5 h-11 rounded-lg border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]";

export type CheckoutSummaryLine = {
  id: string;
  quantity: number;
  unitPriceCents: number;
  variantKey: string;
  variant?: { label: string } | null;
  product: {
    name: string;
    slug: string;
    variants: unknown;
    productVariants?: VariantTierSource[];
    images: { url: string; alt: string }[];
  };
};

export function CheckoutOrderSummary({
  lines,
  subtotalCents,
  discountCents,
  shippingCents,
  taxCents,
  totalCents,
  couponCode,
  couponPending = false,
  couponMessage,
  onCouponCodeChange,
  checkoutFormId = CHECKOUT_FORM_ID,
}: {
  lines: CheckoutSummaryLine[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  couponCode: string;
  couponPending?: boolean;
  couponMessage?: string;
  onCouponCodeChange: (value: string) => void;
  /** Associates the promo field with the checkout form so couponCode submits with Place order. */
  checkoutFormId?: string;
}) {
  const shipLabel = checkoutShippingMethodLabel(shippingCents);
  const hasCouponFeedback = couponPending || Boolean(couponMessage) || discountCents > 0;

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Your order</h2>
        <div className="mt-4 border-b border-[var(--border)] pb-3">
          <div className="grid grid-cols-[1fr_auto] gap-2 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            <span>Product</span>
            <span className="text-right">Subtotal</span>
          </div>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {lines.map((l) => {
            const img = l.product.images[0];
            const tier = tierLabelForVariantKey(l.product, l.variantKey, l.variant);
            const lineTotal = l.unitPriceCents * l.quantity;
            return (
              <li key={l.id} className="flex gap-3 py-4">
                <Link
                  href={`/product/${l.product.slug}`}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--muted)]"
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={productImageDeliveryUrl(img.url, "checkoutThumb")} alt={img.alt || l.product.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-[var(--foreground)]">{l.product.name}</p>
                  {tier ? <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{tier}</p> : null}
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">× {l.quantity}</p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums text-[var(--foreground)]">{formatUsd(lineTotal)}</p>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 border-t border-[var(--border)] pt-4 text-sm">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Subtotal</span>
              <span className="tabular-nums text-[var(--foreground)]">{formatUsd(subtotalCents)}</span>
            </div>
            {discountCents > 0 ? (
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Discount</span>
                <span className="tabular-nums text-emerald-800 dark:text-emerald-200">-{formatUsd(discountCents)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Shipping</span>
              <span className="text-right tabular-nums text-[var(--foreground)]">
                {shippingCents === 0 ? (
                  <span className="font-medium text-emerald-800 dark:text-emerald-200">Free</span>
                ) : (
                  <>
                    {shipLabel}: {formatUsd(shippingCents)}
                  </>
                )}
              </span>
            </div>
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Tax</span>
              <span className="tabular-nums text-[var(--foreground)]">{formatUsd(taxCents)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-3 text-base font-semibold text-[var(--foreground)]">
              <span>Total</span>
              <span className="tabular-nums">{formatUsd(totalCents)}</span>
            </div>
          </div>
          <div id="coupon" className="space-y-1.5 border-t border-[var(--border)] pt-4">
            <label htmlFor="couponCode" className="block text-sm font-medium text-[var(--muted-foreground)]">
              Have a promo code?
            </label>
            <Input
              form={checkoutFormId}
              id="couponCode"
              name="couponCode"
              value={couponCode}
              onChange={(event) => onCouponCodeChange(event.target.value)}
              className={promoInputCls}
              placeholder="Enter code"
              autoComplete="off"
            />
            {hasCouponFeedback ? (
              <p className="text-xs text-[var(--muted-foreground)]" aria-live="polite">
                {couponPending
                  ? "Checking promo code..."
                  : discountCents > 0
                    ? `Promo applied: -${formatUsd(discountCents)}.`
                    : couponMessage}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-xs text-[var(--muted-foreground)]">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" strokeWidth={2.5} aria-hidden />
          <p>
            Totals include shipping and tax. Payment opens on a secure crypto checkout page — your order is confirmed
            after the provider verifies payment.
          </p>
        </div>
      </div>
    </aside>
  );
}
