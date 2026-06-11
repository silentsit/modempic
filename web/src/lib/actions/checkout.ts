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
import { isBtcpayConfigured } from "@/lib/payments/btcpay/client";
import { acceptedCheckoutCryptoAssets } from "@/lib/payments/accepted-crypto-assets";
import { getSiteUrl } from "@/lib/site-url";
import { checkoutTaxCents, computeShippingCents } from "@/lib/domain/checkout-pricing";
import type { CartLineForCoupon } from "@/lib/domain/coupon-eval";
import { env } from "@/lib/env";
import { tierLabelForVariantKey } from "@/lib/cart-price";
import { deriveCheckoutAttribution } from "@/lib/checkout/checkout-attribution";
import {
  buildCartLinesForCoupon,
  genOrderNumber,
  loadCheckoutCart,
} from "@/lib/checkout/checkout-cart";
import { resolveCouponForCheckout } from "@/lib/checkout/checkout-coupon";
import { parseCheckoutForm } from "@/lib/checkout/checkout-form";
import { previewCheckoutTotals } from "@/lib/checkout/checkout-totals";
import type { CheckoutCouponPreview, CheckoutState } from "@/lib/checkout/types";
import { createCheckoutOrderInTransaction } from "@/lib/checkout/checkout-order";
import {
  createBtcpayCheckoutSession,
  createPaymentoCheckoutSession,
} from "@/lib/checkout/checkout-payment-sessions";
import { sendCheckoutOrderEmails } from "@/lib/checkout/checkout-emails";

export type { CheckoutCouponPreview, CheckoutState };

export async function previewCheckoutCouponAction(couponCode: string): Promise<CheckoutCouponPreview> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ...previewCheckoutTotals(0, 0),
      message: "Sign in to apply a promo code.",
    };
  }

  const cart = await loadCheckoutCart(session.user.id);
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
    session.user.id,
    session.user.email,
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
  if (!session?.user?.id) return { error: "You must be signed in." };
  const userId = session.user.id;
  const email = session.user.email;
  if (!email) return { error: "Your account needs an email to checkout." };

  const parsed = parseCheckoutForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const v = parsed.value;
  const selectedAsset = v.asset ?? CryptoAsset.USDT;
  if (!acceptedCheckoutCryptoAssets().includes(selectedAsset)) {
    return { error: "Selected asset is not available for checkout." };
  }
  if (v.paymentMethod === "CRYPTO" && !getAvailableCheckoutCryptoAssets().includes(selectedAsset)) {
    return { error: cryptoCheckoutMisconfigMessageForAsset(selectedAsset) };
  }
  let cryptoProvider: CryptoCheckoutProvider | null =
    v.paymentMethod === "CRYPTO" ? resolveCryptoCheckoutProviderForAsset(selectedAsset) : null;
  // Belt-and-suspenders: BTC must use BTCPay when configured (unless CRYPTO_PROVIDER=paymento debug override).
  if (
    v.paymentMethod === "CRYPTO" &&
    selectedAsset === CryptoAsset.BTC &&
    cryptoProvider === "paymento" &&
    isBtcpayConfigured()
  ) {
    const pref = env.CRYPTO_PROVIDER?.trim();
    if (pref !== "paymento") {
      cryptoProvider = "btcpay";
    }
  }
  if (v.paymentMethod === "CRYPTO" && cryptoProvider === null) {
    return { error: cryptoCheckoutMisconfigMessageForAsset(selectedAsset) };
  }

  const cart = await loadCheckoutCart(userId);
  if (!cart?.items.length) return { error: "Your cart is empty." };

  let subtotalCents = 0;
  const cartLines: CartLineForCoupon[] = [];
  const lineCreates: {
    productId: string;
    title: string;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
    variantId?: string | null;
    variantKey?: string | null;
    variantLabel?: string | null;
    sku?: string | null;
  }[] = [];
  const cartRestoreLines: {
    productId: string;
    quantity: number;
    unitPriceCents: number;
    variantKey: string;
    variantId?: string | null;
  }[] = [];
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
    cartRestoreLines.push({
      productId: line.productId,
      unitPriceCents: unitCents,
      quantity: line.quantity,
      variantKey: line.variantKey,
      variantId: line.variantId,
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

  const baseUrl = getSiteUrl();
  const returnUrl = `${baseUrl}/order/${orderNumberOut}/confirmation`;

  let cardWidgetUrl: string | undefined;
  let paymentoGatewayUrlToRedirect: string | undefined;
  let btcpayCheckoutResult:
    | {
        invoiceId: string;
        checkoutLink: string;
        orderNumber: string;
        confirmationUrl: string;
        btcpayUrl: string;
      }
    | undefined;

  try {
    const { order, cardWidgetUrl: cardUrl } = await createCheckoutOrderInTransaction({
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
    cardWidgetUrl = cardUrl;

    if (v.paymentMethod === "CRYPTO" && cryptoProvider === "btcpay") {
      const btcpayResult = await createBtcpayCheckoutSession({
        orderId: order.id,
        orderNumber: orderNumberOut,
        totalCents,
        returnUrl,
        email,
        cartId: cart.id,
        cartRestoreLines,
      });
      if (!btcpayResult.ok) {
        return { error: btcpayResult.error };
      }
      btcpayCheckoutResult = btcpayResult.session;
    }

    if (v.paymentMethod === "CRYPTO" && cryptoProvider === "paymento") {
      const paymentoResult = await createPaymentoCheckoutSession({
        orderId: order.id,
        orderNumber: orderNumberOut,
        totalCents,
        returnUrl,
        asset: v.asset ?? CryptoAsset.USDT,
        cartId: cart.id,
        cartRestoreLines,
      });
      if (!paymentoResult.ok) {
        return { error: paymentoResult.error };
      }
      paymentoGatewayUrlToRedirect = paymentoResult.gatewayUrl;
    }

    revalidatePath("/account");

    await sendCheckoutOrderEmails({
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
    });

    const { enrollUnpaidOrderFunnel, cancelAbandonedCartFunnel } = await import("@/lib/email/funnels/enroll");
    void enrollUnpaidOrderFunnel({
      userId,
      email,
      orderId: order.id,
      orderNumber: orderNumberOut,
      totalCents,
      customerName: v.ship.fullName?.trim() || session.user.name,
    }).catch((err) => console.error("[funnel] unpaid order enroll failed", err));
    void cancelAbandonedCartFunnel(cart.id).catch((err) =>
      console.error("[funnel] abandoned cart cancel failed", err),
    );
  } catch (e) {
    console.error(e);
    if (e instanceof Error && e.message === "CRYPTO_CHECKOUT_MISCONFIG") {
      return { error: cryptoCheckoutMisconfigMessage() };
    }
    return { error: "Could not create order. Please try again or contact support." };
  }

  if (btcpayCheckoutResult) {
    redirect(`${btcpayCheckoutResult.confirmationUrl}?pay=1`);
  }
  if (paymentoGatewayUrlToRedirect) {
    redirect(paymentoGatewayUrlToRedirect);
  }
  if (cardWidgetUrl?.startsWith("http")) {
    redirect(cardWidgetUrl);
  }
  redirect(`/order/${orderNumberOut!}/confirmation`);
}
