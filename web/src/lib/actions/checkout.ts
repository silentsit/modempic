"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CryptoAsset, ProductStatus } from "@prisma/client";
import { auth } from "@/auth";
import {
  cryptoCheckoutMisconfigMessage,
  cryptoCheckoutMisconfigMessageForAsset,
  getAvailableCheckoutCryptoAssets,
  resolveCryptoCheckoutProviderForAsset,
  type CryptoCheckoutProvider,
} from "@/lib/payments/crypto-provider";
import { acceptedCheckoutCryptoAssets } from "@/lib/payments/accepted-crypto-assets";
import { checkoutTaxCents, computeShippingCents } from "@/lib/domain/checkout-pricing";
import type { CartLineForCoupon } from "@/lib/domain/coupon-eval";
import { tierLabelForVariantKey } from "@/lib/cart-price";
import { deriveCheckoutAttribution } from "@/lib/checkout/checkout-attribution";
import {
  buildCartLinesForCoupon,
  genOrderNumber,
  loadCheckoutCartByOwner,
} from "@/lib/checkout/checkout-cart";
import { resolveCouponForCheckout } from "@/lib/checkout/checkout-coupon";
import { parseCheckoutForm } from "@/lib/checkout/checkout-form";
import { previewCheckoutTotals } from "@/lib/checkout/checkout-totals";
import type { CheckoutCouponPreview, CheckoutState } from "@/lib/checkout/types";
import {
  createCheckoutOrderInTransaction,
  type CheckoutOrderLineCreate,
} from "@/lib/checkout/checkout-order";
import { sendCheckoutOrderEmails } from "@/lib/checkout/checkout-emails";
import { isPeptidePayConfigured } from "@/lib/payments/peptidepay";
import { grantGuestOrderAccess, mergeGuestCartIntoUser, resolveCartOwner } from "@/lib/cart/owner";
import { resolveGuestCheckoutUser } from "@/lib/checkout/guest-user";

export type { CheckoutCouponPreview, CheckoutState };

export async function previewCheckoutCouponAction(couponCode: string): Promise<CheckoutCouponPreview> {
  const session = await auth();
  if (session?.user?.id) {
    await mergeGuestCartIntoUser(session.user.id);
  }
  const owner = await resolveCartOwner();
  if (!owner) {
    return {
      ...previewCheckoutTotals(0, 0),
      message: "Your cart is empty.",
    };
  }

  const cart = await loadCheckoutCartByOwner(owner);
  if (!cart?.items.length) {
    return {
      ...previewCheckoutTotals(0, 0),
      message: "Your cart is empty.",
    };
  }

  const cartLines = buildCartLinesForCoupon(cart);
  const subtotalCents = cartLines.reduce((s, l) => s + l.lineTotalCents, 0);
  if (cartLines.length === 0) {
    return {
      ...previewCheckoutTotals(0, 0),
      message: "Your cart has no eligible items to preview a promo.",
    };
  }

  const resolved = await resolveCouponForCheckout(
    session?.user?.id ?? ("guestKey" in owner ? owner.guestKey : "guest"),
    session?.user?.email ?? null,
    couponCode,
    cartLines,
    subtotalCents,
  );
  const couponGrantsFreeShipping = Boolean(resolved.couponId && resolved.freeShipping);
  return {
    ...previewCheckoutTotals(subtotalCents, resolved.discountCents, { couponGrantsFreeShipping }),
    appliedCode: resolved.appliedCode,
    message: resolved.message,
  };
}

export async function submitCheckoutAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const session = await auth();
  const parsed = parseCheckoutForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const v = parsed.value;

  let userId: string;
  let email: string;
  let customerName: string | null = null;

  if (session?.user?.id) {
    await mergeGuestCartIntoUser(session.user.id);
    userId = session.user.id;
    email = session.user.email ?? "";
    customerName = session.user.name ?? null;
    if (!email) return { error: "Your account needs an email to checkout." };
  } else {
    const guest = await resolveGuestCheckoutUser({
      email: v.guestEmail ?? "",
      name: v.bill.fullName,
    });
    if (!guest.ok) return { error: guest.error };
    userId = guest.user.id;
    email = guest.user.email;
    customerName = guest.user.name;
    await mergeGuestCartIntoUser(userId);
  }

  const selectedAsset = v.asset ?? CryptoAsset.USDT;
  if (v.paymentMethod === "CARD_ONRAMP" && !isPeptidePayConfigured()) {
    return { error: "Card checkout is not configured. Choose cryptocurrency or contact support." };
  }
  if (v.paymentMethod === "CRYPTO" && !acceptedCheckoutCryptoAssets().includes(selectedAsset)) {
    return { error: "Selected asset is not available for checkout." };
  }
  if (v.paymentMethod === "CRYPTO" && !getAvailableCheckoutCryptoAssets().includes(selectedAsset)) {
    return { error: cryptoCheckoutMisconfigMessageForAsset(selectedAsset) };
  }
  const cryptoProvider: CryptoCheckoutProvider | null =
    v.paymentMethod === "CRYPTO" ? resolveCryptoCheckoutProviderForAsset(selectedAsset) : null;
  if (v.paymentMethod === "CRYPTO" && cryptoProvider === null) {
    return { error: cryptoCheckoutMisconfigMessageForAsset(selectedAsset) };
  }

  const cart = await loadCheckoutCartByOwner({ userId });
  if (!cart?.items.length) return { error: "Your cart is empty." };

  let subtotalCents = 0;
  const cartLines: CartLineForCoupon[] = [];
  const lineCreates: CheckoutOrderLineCreate[] = [];
  for (const line of cart.items) {
    if (line.product.status !== ProductStatus.PUBLISHED) {
      return { error: `Product unavailable: ${line.product.name}` };
    }
    const unitCents = line.unitPriceCents;
    const lineTotal = unitCents * line.quantity;
    subtotalCents += lineTotal;
    cartLines.push({
      productId: line.productId,
      lineTotalCents: lineTotal,
      categoryIds: line.product.categories.map((c) => c.categoryId),
      compareAtCents: line.product.compareAtCents,
      unitPriceCents: unitCents,
    });
    const variantLabel =
      line.variant?.label ??
      tierLabelForVariantKey(line.product, line.variantKey, line.variant) ??
      null;
    const sku = line.variant?.sku ?? line.product.sku ?? line.product.slug;
    lineCreates.push({
      productId: line.productId,
      title: line.product.name,
      unitPriceCents: unitCents,
      quantity: line.quantity,
      lineTotalCents: lineTotal,
      variantId: line.variantId,
      variantKey: line.variantKey,
      variantLabel,
      sku,
    });
  }

  const couponResult = await resolveCouponForCheckout(userId, email, v.couponCode, cartLines, subtotalCents);
  const enteredCoupon = Boolean(v.couponCode?.trim());
  if (enteredCoupon && !couponResult.couponId) {
    return { error: couponResult.message ?? "Promo code could not be applied." };
  }
  const discountCents = Math.max(0, Math.min(subtotalCents, couponResult.discountCents));
  const subtotalAfterDiscount = subtotalCents - discountCents;
  const baselineShipping = computeShippingCents(subtotalAfterDiscount);
  const shippingCents =
    couponResult.couponId && couponResult.freeShipping && baselineShipping > 0 ? 0 : baselineShipping;
  const taxCents = checkoutTaxCents(subtotalAfterDiscount);
  const totalCents = subtotalCents + taxCents + shippingCents - discountCents;
  if (totalCents < 0) return { error: "Invalid total." };

  const shippingSavedByCoupon = Boolean(
    couponResult.couponId && couponResult.freeShipping && baselineShipping > 0,
  );
  const shouldCountRedemption = Boolean(
    couponResult.couponId && (discountCents > 0 || shippingSavedByCoupon),
  );
  const couponId = shouldCountRedemption ? couponResult.couponId : undefined;

  const orderNumberOut = genOrderNumber();
  const shipAddr = v.ship;
  const billAddr = v.bill;
  const attribution = await deriveCheckoutAttribution();

  try {
    const { order } = await createCheckoutOrderInTransaction({
      userId,
      email,
      orderNumber: orderNumberOut,
      cartId: cart.id,
      shipAddr,
      billAddr,
      subtotalCents,
      taxCents,
      shippingCents,
      discountCents,
      totalCents,
      couponId,
      orderNotes: v.orderNotes,
      attribution,
      lineCreates,
      paymentMethod: v.paymentMethod,
      cryptoProvider,
      asset: v.asset,
    });

    if (!session?.user?.id) {
      await grantGuestOrderAccess(orderNumberOut);
    }

    revalidatePath("/account");

    void sendCheckoutOrderEmails({
      customerEmail: email,
      orderNumber: orderNumberOut,
      orderDate: order.createdAt,
      shipAddr,
      billAddr,
      lineCreates,
      subtotalCents,
      taxCents,
      shippingCents,
      discountCents,
      totalCents,
      paymentMethod: v.paymentMethod,
      cryptoProvider,
    }).catch((err) => console.error("[checkout] order email failed", err));

    const { enrollUnpaidOrderFunnel, cancelAbandonedCartFunnel } = await import("@/lib/email/funnels/enroll");
    void enrollUnpaidOrderFunnel({
      userId,
      email,
      orderId: order.id,
      orderNumber: orderNumberOut,
      totalCents,
      customerName: v.ship.fullName?.trim() || customerName,
    }).catch((err) => console.error("[funnel] unpaid order enroll failed", err));
    void cancelAbandonedCartFunnel(cart.id).catch((err) =>
      console.error("[funnel] abandoned cart cancel failed", err),
    );

    const usesHostedGateway =
      v.paymentMethod === "CARD_ONRAMP" || (v.paymentMethod === "CRYPTO" && cryptoProvider === "paymento");
    if (usesHostedGateway) {
      return { redirectTo: `/checkout/payment?order=${encodeURIComponent(orderNumberOut)}` };
    }
  } catch (e) {
    console.error(e);
    if (e instanceof Error && e.message === "CRYPTO_CHECKOUT_MISCONFIG") {
      return { error: cryptoCheckoutMisconfigMessage() };
    }
    return { error: "Could not create order. Please try again or contact support." };
  }

  redirect(`/order/${orderNumberOut}/confirmation`);
}
