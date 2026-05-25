/**
 * Checkout shipping & tax rules (single source of truth for new orders).
 * Change thresholds here if policy updates.
 */

/**
 * Discounted item subtotal (after coupons) must be **strictly greater than** this amount to get free shipping (USD cents).
 * i.e. free shipping when subtotal &gt; $180.00 — exactly $180.00 still pays flat shipping.
 */
export const FREE_SHIPPING_THRESHOLD_CENTS = 180_00; // $180.00 — must exceed, not equal

/** First integer-cent subtotal that qualifies for free shipping ({@link FREE_SHIPPING_THRESHOLD_CENTS} + 1¢). */
export const FREE_SHIPPING_QUALIFY_AT_CENTS = FREE_SHIPPING_THRESHOLD_CENTS + 1;

/** Flat shipping when discounted subtotal is not above {@link FREE_SHIPPING_THRESHOLD_CENTS}. */
export const FLAT_SHIPPING_CENTS = 20_00; // $20.00

/**
 * Tax on checkout orders — currently none unless policy changes.
 * @param subtotalAfterDiscountCents — reserved for future tax basis (same as shipping / order total).
 */
export function checkoutTaxCents(subtotalAfterDiscountCents: number): number {
  void subtotalAfterDiscountCents;
  return 0;
}

/**
 * @param subtotalAfterDiscountCents — item subtotal minus coupon discount (same basis as order total calculation).
 */
export function computeShippingCents(subtotalAfterDiscountCents: number): number {
  if (subtotalAfterDiscountCents > FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return FLAT_SHIPPING_CENTS;
}

export function checkoutShippingMethodLabel(shippingCents: number): string {
  if (shippingCents === 0) return "Free Shipping";
  return "Express Shipping";
}
