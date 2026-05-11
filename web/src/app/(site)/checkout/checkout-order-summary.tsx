import Link from "next/link";
import { Input } from "@/components/ui/input";
import { tierLabelForVariantKey } from "@/lib/cart-price";
import { formatUsd } from "@/lib/domain/money";
import { checkoutShippingMethodLabel, computeShippingCents, checkoutTaxCents } from "@/lib/domain/checkout-pricing";
import { CHECKOUT_FORM_ID } from "./checkout-form-id";

const promoInputCls =
  "mt-1.5 h-11 rounded-lg border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]";

type Line = {
  id: string;
  quantity: number;
  unitPriceCents: number;
  variantKey: string;
  product: {
    name: string;
    slug: string;
    variants: unknown;
    images: { url: string; alt: string }[];
  };
};

export function CheckoutOrderSummary({
  lines,
  subtotalCents,
  checkoutFormId = CHECKOUT_FORM_ID,
}: {
  lines: Line[];
  subtotalCents: number;
  /** Associates the promo field with the checkout form so couponCode submits with Place order. */
  checkoutFormId?: string;
}) {
  const subtotalAfterDiscountEstimate = subtotalCents;
  const shippingCents = computeShippingCents(subtotalAfterDiscountEstimate);
  const taxCents = checkoutTaxCents(subtotalAfterDiscountEstimate);
  const totalCents = subtotalCents + taxCents + shippingCents;
  const shipLabel = checkoutShippingMethodLabel(shippingCents);

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
            const tier = tierLabelForVariantKey(l.product, l.variantKey);
            const lineTotal = l.unitPriceCents * l.quantity;
            return (
              <li key={l.id} className="flex gap-3 py-4">
                <Link
                  href={`/product/${l.product.slug}`}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--muted)]"
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt={img.alt || l.product.name} className="h-full w-full object-cover" loading="lazy" />
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
              className={promoInputCls}
              placeholder="Enter code"
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
