/**
 * Checkout shipping & tax rules (single source of truth for new orders).
 */

/**
 * Tax on checkout orders — currently none unless policy changes.
 * @param subtotalAfterDiscountCents — reserved for future tax basis (same as shipping / order total).
 */
export function checkoutTaxCents(subtotalAfterDiscountCents: number): number {
  void subtotalAfterDiscountCents;
  return 0;
}

/** All orders ship free worldwide. */
export function computeShippingCents(_subtotalAfterDiscountCents: number): number {
  void _subtotalAfterDiscountCents;
  return 0;
}

export function checkoutShippingMethodLabel(shippingCents: number): string {
  if (shippingCents === 0) return "Free Shipping";
  return "Express Shipping";
}
