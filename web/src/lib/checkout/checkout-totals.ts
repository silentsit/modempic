import {
  checkoutTaxCents,
  computeShippingCents,
} from "@/lib/domain/checkout-pricing";
import type { CheckoutCouponPreview } from "./types";

export function previewCheckoutTotals(
  subtotalCents: number,
  discountCents: number,
  opts?: { couponGrantsFreeShipping?: boolean },
): CheckoutCouponPreview {
  const boundedDiscountCents = Math.max(0, Math.min(subtotalCents, discountCents));
  const subtotalAfterDiscountCents = subtotalCents - boundedDiscountCents;
  const baselineShipping = computeShippingCents(subtotalAfterDiscountCents);
  const shippingCents =
    opts?.couponGrantsFreeShipping && baselineShipping > 0 ? 0 : baselineShipping;
  const taxCents = checkoutTaxCents(subtotalAfterDiscountCents);
  const totalCents = subtotalCents + taxCents + shippingCents - boundedDiscountCents;

  return {
    discountCents: boundedDiscountCents,
    shippingCents,
    taxCents,
    totalCents,
    subtotalAfterDiscountCents,
  };
}
