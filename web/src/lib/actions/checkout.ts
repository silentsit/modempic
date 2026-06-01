"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CryptoAsset, OrderStatus, PaymentMethod, PaymentStatus, ProductStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createSimulatedCryptoPayment } from "@/lib/payments/crypto-simulate";
import { createGuardarianSession } from "@/lib/payments/guardarian-adapter";
import {
  paymentoCreatePaymentRequest,
  paymentoGatewayUrl,
  getPaymentoSpeedFromEnv,
} from "@/lib/payments/paymento";
import { btcpayCreateInvoice, getBtcpayPublicUrl } from "@/lib/payments/btcpay";
import {
  cryptoCheckoutMisconfigMessage,
  resolveCryptoCheckoutProvider,
  type CryptoCheckoutProvider,
} from "@/lib/payments/crypto-provider";
import { getSiteUrl } from "@/lib/site-url";
import {
  checkoutShippingMethodLabel,
  checkoutTaxCents,
  computeShippingCents,
} from "@/lib/domain/checkout-pricing";
import {
  evaluateCouponForCart,
  type CartLineForCoupon,
  type CouponEvalResult,
} from "@/lib/domain/coupon-eval";
import { env } from "@/lib/env";
import type { EmailAddressBlock, OrderEmailPayload } from "@/lib/email/types";
import { sendAdminNewOrderEmail, sendOrderPlacedEmail } from "@/lib/email/send";
import { z } from "zod";

const addr = z.object({
  fullName: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(2),
  postal: z.string().min(3).max(20),
  phone: z.string().max(30).optional(),
  country: z.string().min(2).max(2).default("US"),
});

function genOrderNumber() {
  return `MP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function clearCheckoutCart(cartId: string) {
  await prisma.cartLine.deleteMany({ where: { cartId } });
  revalidatePath("/cart");
  revalidatePath("/");
}

async function restoreCartIfEmpty(
  cartId: string,
  lines: { productId: string; quantity: number; unitPriceCents: number }[],
) {
  const count = await prisma.cartLine.count({ where: { cartId } });
  if (count > 0) return;
  for (const line of lines) {
    await prisma.cartLine.create({
      data: {
        cartId,
        productId: line.productId,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
      },
    });
  }
  revalidatePath("/cart");
  revalidatePath("/");
}

function defersCartClearUntilGateway(
  paymentMethod: "CRYPTO" | "CARD_ONRAMP",
  cryptoProvider: CryptoCheckoutProvider | null,
): boolean {
  return paymentMethod === "CRYPTO" && (cryptoProvider === "btcpay" || cryptoProvider === "paymento");
}

async function deriveAttribution() {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const referrer = h.get("referer") ?? h.get("referrer") ?? "";
  const xff = h.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0]?.trim() || h.get("x-real-ip") || null;

  let originSource: string | null = "Direct";
  let originReferrer: string | null = null;
  if (referrer) {
    try {
      const u = new URL(referrer);
      originReferrer = u.hostname.replace(/^www\./, "");
      const search = u.searchParams.toString().toLowerCase();
      if (/google\.|bing\.|duckduckgo\.|yahoo\.|yandex\./.test(originReferrer)) {
        originSource = "Organic";
      } else if (originReferrer && !originReferrer.endsWith("modempic.com")) {
        originSource = "Referral";
      }
      if (/(^|[?&])(utm_|gclid|fbclid)/.test(search)) originSource = "Paid";
    } catch {
      originReferrer = null;
    }
  }

  let deviceType = "Desktop";
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
    deviceType = /iPad|Tablet/i.test(ua) ? "Tablet" : "Mobile";
  }

  return { originSource, originReferrer, deviceType, customerIp: ip };
}

const checkoutSchema = z.object({
  paymentMethod: z.enum(["CRYPTO", "CARD_ONRAMP"]),
  asset: z.nativeEnum(CryptoAsset).optional(),
  couponCode: z.string().max(32).optional(),
  orderNotes: z.string().max(5000).optional(),
  ship: addr,
  bill: addr,
});

export type CheckoutState =
  | { error: string }
  | { redirectTo: string }
  | {
      btcpayCheckout: {
        invoiceId: string;
        checkoutLink: string;
        orderNumber: string;
        confirmationUrl: string;
        btcpayUrl: string;
      };
    }
  | null;

export type CheckoutCouponPreview = {
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  subtotalAfterDiscountCents: number;
  appliedCode?: string;
  message?: string;
};

function joinBillLine2(company: string, apt: string): string | undefined {
  const c = company.trim();
  const a = apt.trim();
  const parts: string[] = [];
  if (c) parts.push(`Company: ${c}`);
  if (a) parts.push(a);
  return parts.length ? parts.join(" · ") : undefined;
}

function joinFullName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim();
}

function parseForm(fd: FormData): { ok: true; value: z.infer<typeof checkoutSchema> } | { ok: false; error: string } {
  const shipDifferent = fd.get("shipDifferent") === "on";

  const bill = {
    fullName: joinFullName(String(fd.get("billFirstName") ?? ""), String(fd.get("billLastName") ?? "")),
    line1: String(fd.get("billLine1") ?? ""),
    line2: joinBillLine2(String(fd.get("billCompany") ?? ""), String(fd.get("billLine2") ?? "")),
    city: String(fd.get("billCity") ?? ""),
    state: String(fd.get("billState") ?? "").toUpperCase().slice(0, 2),
    postal: String(fd.get("billPostal") ?? ""),
    phone: String(fd.get("billPhone") ?? "").trim() || undefined,
    country: (String(fd.get("billCountry") ?? "US") || "US").toUpperCase().slice(0, 2),
  };

  const ship = shipDifferent
    ? {
        fullName: joinFullName(String(fd.get("shipFirstName") ?? ""), String(fd.get("shipLastName") ?? "")),
        line1: String(fd.get("shipLine1") ?? ""),
        line2: joinBillLine2(String(fd.get("shipCompany") ?? ""), String(fd.get("shipLine2") ?? "")),
        city: String(fd.get("shipCity") ?? ""),
        state: String(fd.get("shipState") ?? "").toUpperCase().slice(0, 2),
        postal: String(fd.get("shipPostal") ?? ""),
        phone: String(fd.get("shipPhone") ?? "").trim() || undefined,
        country: (String(fd.get("shipCountry") ?? "US") || "US").toUpperCase().slice(0, 2),
      }
    : bill;

  const assetStr = String(fd.get("asset") ?? "USDT");
  const asset = (CryptoAsset as Record<string, CryptoAsset>)[assetStr] ?? CryptoAsset.USDT;

  const parsed = checkoutSchema.safeParse({
    paymentMethod: fd.get("paymentMethod") === "CARD_ONRAMP" ? "CARD_ONRAMP" : "CRYPTO",
    asset,
    couponCode: String(fd.get("couponCode") ?? "").trim() || undefined,
    orderNotes: String(fd.get("orderNotes") ?? "").trim() || undefined,
    ship,
    bill,
  });

  if (!parsed.success) return { ok: false, error: "Check addresses and try again." };
  return { ok: true, value: parsed.data };
}

function previewTotals(
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

const COUPON_RULES_INCLUDE = {
  productIncludes: true,
  productExcludes: true,
  categoryIncludes: true,
  categoryExcludes: true,
} as const;

async function loadCheckoutCart(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: { include: { categories: true } },
        },
      },
    },
  });
}

function buildCartLinesForCoupon(
  cart: NonNullable<Awaited<ReturnType<typeof loadCheckoutCart>>>,
): CartLineForCoupon[] {
  return cart.items
    .filter((line) => line.product.status === ProductStatus.PUBLISHED)
    .map((line) => ({
      productId: line.productId,
      lineTotalCents: line.unitPriceCents * line.quantity,
      categoryIds: line.product.categories.map((c) => c.categoryId),
      compareAtCents: line.product.compareAtCents,
      unitPriceCents: line.unitPriceCents,
    }));
}

async function resolveCouponForCheckout(
  userId: string,
  userEmail: string | null,
  couponCode: string | undefined,
  cartLines: CartLineForCoupon[],
  cartSubtotalCents: number,
): Promise<CouponEvalResult> {
  const raw = couponCode?.trim();
  if (!raw) return { discountCents: 0, freeShipping: false };
  const codeKey = raw.toUpperCase();
  const coupon = await prisma.coupon.findUnique({
    where: { code: codeKey },
    include: COUPON_RULES_INCLUDE,
  });
  if (!coupon) return { discountCents: 0, message: "Promo code not found.", freeShipping: false };

  const userRedemptionCount = await prisma.order.count({
    where: {
      userId,
      couponId: coupon.id,
      status: { notIn: [OrderStatus.DRAFT, OrderStatus.CANCELLED, OrderStatus.FAILED] },
    },
  });

  return evaluateCouponForCart(coupon, raw, cartLines, cartSubtotalCents, {
    userId,
    userEmail,
    userRedemptionCount,
  });
}

export async function previewCheckoutCouponAction(couponCode: string): Promise<CheckoutCouponPreview> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ...previewTotals(0, 0),
      message: "Sign in to apply a promo code.",
    };
  }

  const cart = await loadCheckoutCart(session.user.id);
  if (!cart?.items.length) {
    return {
      ...previewTotals(0, 0),
      message: "Your cart is empty.",
    };
  }

  const cartLines = buildCartLinesForCoupon(cart);
  const subtotalCents = cartLines.reduce((s, l) => s + l.lineTotalCents, 0);
  if (cartLines.length === 0) {
    return {
      ...previewTotals(0, 0),
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
    ...previewTotals(subtotalCents, resolved.discountCents, { couponGrantsFreeShipping }),
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

  const parsed = parseForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const v = parsed.value;

  const cart = await loadCheckoutCart(userId);
  if (!cart?.items.length) return { error: "Your cart is empty." };

  let subtotalCents = 0;
  const cartLines: CartLineForCoupon[] = [];
  const lineCreates: { productId: string; title: string; unitPriceCents: number; quantity: number; lineTotalCents: number }[] = [];
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
    lineCreates.push({
      productId: line.productId,
      title: line.product.name,
      unitPriceCents: unitCents,
      quantity: line.quantity,
      lineTotalCents: lineTotal,
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
  const attribution = await deriveAttribution();

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

  const cryptoProvider: CryptoCheckoutProvider | null =
    v.paymentMethod === "CRYPTO" ? resolveCryptoCheckoutProvider() : null;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const ship = await tx.address.create({
        data: { userId, label: "Shipping", ...shipAddr },
      });
      const bill = await tx.address.create({
        data: { userId, label: "Billing", ...billAddr },
      });
      if (shouldCountRedemption && couponId) {
        await tx.coupon.update({ where: { id: couponId }, data: { redemptionCount: { increment: 1 } } });
      }
      const o = await tx.order.create({
        data: {
          orderNumber: orderNumberOut,
          userId,
          status: OrderStatus.PENDING_PAYMENT,
          subtotalCents,
          taxCents,
          shippingCents,
          discountCents,
          totalCents,
          currency: "USD",
          shippingAddressId: ship.id,
          billingAddressId: bill.id,
          shippingMethod: checkoutShippingMethodLabel(shippingCents),
          originSource: attribution.originSource,
          originReferrer: attribution.originReferrer,
          deviceType: attribution.deviceType,
          customerIp: attribution.customerIp,
          couponId,
          notes: v.orderNotes ?? undefined,
          lines: { create: lineCreates },
        },
      });
      if (v.paymentMethod === "CRYPTO" && cryptoProvider === "sim") {
        const sim = createSimulatedCryptoPayment({
          orderId: o.id,
          amountCents: totalCents,
          asset: v.asset ?? CryptoAsset.USDT,
        });
        const pay = await tx.payment.create({
          data: {
            orderId: o.id,
            method: PaymentMethod.CRYPTO,
            status: PaymentStatus.PENDING,
            idempotencyKey: sim.idempotencyKey,
            amountCents: totalCents,
            provider: sim.provider,
            externalId: sim.externalId,
            asset: sim.asset,
            payAddress: sim.payAddress,
            payAmountCrypto: sim.payAmountLabel,
            expiresAt: sim.expiresAt,
          },
        });
        await tx.paymentEvent.create({
          data: {
            paymentId: pay.id,
            type: "CREATED",
            idempotencyKey: `${sim.idempotencyKey}_created`,
            payload: { provider: sim.provider, mode: "sim" },
          },
        });
      } else if (v.paymentMethod === "CRYPTO" && defersCartClearUntilGateway(v.paymentMethod, cryptoProvider)) {
        // BTCPay / Paymento: payment record + cart clear after external gateway succeeds.
      } else if (v.paymentMethod === "CRYPTO") {
        throw new Error("CRYPTO_CHECKOUT_MISCONFIG");
      } else {
        const g = createGuardarianSession({
          orderId: o.id,
          orderNumber: o.orderNumber,
          amountCents: totalCents,
          email,
        });
        cardWidgetUrl = g.widgetUrl;
        const pay = await tx.payment.create({
          data: {
            orderId: o.id,
            method: PaymentMethod.CARD_ONRAMP,
            status: PaymentStatus.REQUIRES_ACTION,
            idempotencyKey: g.idempotencyKey,
            amountCents: totalCents,
            provider: g.provider,
            externalId: g.externalId,
          },
        });
        await tx.paymentEvent.create({
          data: {
            paymentId: pay.id,
            type: "ONRAMP_SESSION_CREATED",
            idempotencyKey: `${g.idempotencyKey}_session`,
            payload: { widgetUrl: g.widgetUrl },
          },
        });
      }

      if (!defersCartClearUntilGateway(v.paymentMethod, cryptoProvider)) {
        await tx.cartLine.deleteMany({ where: { cartId: cart.id } });
      }
      return o;
    });

    if (v.paymentMethod === "CRYPTO" && cryptoProvider === "btcpay") {
      const inv = await btcpayCreateInvoice({
        amountUsd: totalCents / 100,
        orderNumber: orderNumberOut,
        redirectUrl: returnUrl,
        buyerEmail: email,
      });
      if (!inv.success) {
        await restoreCartIfEmpty(cart.id, lineCreates);
        return {
          error: `BTCPay: ${inv.error}. Order ${orderNumberOut} was created; contact support or retry from your orders list.`,
        };
      }
      const btcpayUrl = getBtcpayPublicUrl();
      if (!btcpayUrl) {
        await restoreCartIfEmpty(cart.id, lineCreates);
        return { error: "BTCPay public URL is not configured." };
      }
      const pay = await prisma.payment.create({
        data: {
          orderId: order.id,
          method: PaymentMethod.CRYPTO,
          status: PaymentStatus.PENDING,
          idempotencyKey: `btcpay_init_${orderNumberOut}`,
          amountCents: totalCents,
          provider: "btcpay",
          externalId: inv.invoice.id,
          payAddress: inv.invoice.checkoutLink,
          payAmountCrypto: "Bitcoin / Lightning (BTCPay)",
          asset: CryptoAsset.BTC,
        },
      });
      await prisma.paymentEvent.create({
        data: {
          paymentId: pay.id,
          type: "BTCPAY_INVOICE_CREATED",
          idempotencyKey: `btcpay_evt_${orderNumberOut}`,
          payload: { checkoutLink: inv.invoice.checkoutLink, returnUrl },
        },
      });
      btcpayCheckoutResult = {
        invoiceId: inv.invoice.id,
        checkoutLink: inv.invoice.checkoutLink,
        orderNumber: orderNumberOut,
        confirmationUrl: returnUrl,
        btcpayUrl,
      };
      await clearCheckoutCart(cart.id);
    }

    if (v.paymentMethod === "CRYPTO" && cryptoProvider === "paymento") {
      const pr = await paymentoCreatePaymentRequest({
        fiatAmount: (totalCents / 100).toFixed(2),
        fiatCurrency: "USD",
        orderId: orderNumberOut,
        returnUrl,
        speed: getPaymentoSpeedFromEnv(),
        additionalData: [{ key: "internalOrderId", value: order.id }],
      });
      if (!pr.success) {
        await restoreCartIfEmpty(cart.id, lineCreates);
        return { error: `Paymento: ${pr.error}. Order ${orderNumberOut} was created; contact support or retry from your orders list.` };
      }
      const gateway = paymentoGatewayUrl(pr.token);
      const pay = await prisma.payment.create({
        data: {
          orderId: order.id,
          method: PaymentMethod.CRYPTO,
          status: PaymentStatus.PENDING,
          idempotencyKey: `paymento_init_${orderNumberOut}`,
          amountCents: totalCents,
          provider: "paymento",
          externalId: pr.token,
          payAddress: gateway,
          payAmountCrypto: "Paymento (crypto to merchant wallet)",
          asset: v.asset ?? CryptoAsset.USDT,
        },
      });
      await prisma.paymentEvent.create({
        data: {
          paymentId: pay.id,
          type: "PAYMENTO_REQUEST_CREATED",
          idempotencyKey: `paymento_evt_${orderNumberOut}`,
          payload: { returnUrl },
        },
      });
      paymentoGatewayUrlToRedirect = gateway;
      await clearCheckoutCart(cart.id);
    }

    revalidatePath("/account");

    const paymentMethodLabel =
      v.paymentMethod === "CRYPTO" && cryptoProvider === "btcpay"
        ? "Bitcoin / Lightning (BTCPay)"
        : v.paymentMethod === "CRYPTO" && cryptoProvider === "paymento"
          ? "Cryptocurrency"
          : v.paymentMethod === "CRYPTO" && cryptoProvider === "sim"
            ? "Cryptocurrency (test)"
            : v.paymentMethod === "CRYPTO"
              ? "Cryptocurrency"
              : "Credit/Debit Cards (Visa/MasterCard/Amex/Discover)";

    const toBlock = (a: typeof shipAddr): EmailAddressBlock => ({
      fullName: a.fullName,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      state: a.state,
      postal: a.postal,
      country: a.country ?? "US",
      phone: a.phone,
    });

    const orderEmailPayload: OrderEmailPayload = {
      orderNumber: orderNumberOut!,
      customerFullName: shipAddr.fullName,
      orderDate: order.createdAt,
      lines: lineCreates.map((l) => ({
        title: l.title,
        quantity: l.quantity,
        lineTotalCents: l.lineTotalCents,
      })),
      subtotalCents,
      taxCents,
      shippingCents,
      discountCents,
      totalCents,
      shippingMethod: checkoutShippingMethodLabel(shippingCents),
      paymentMethod: paymentMethodLabel,
      shippingAddress: toBlock(shipAddr),
      billingAddress: toBlock(billAddr),
    };

    try {
      await sendOrderPlacedEmail(email, { ...orderEmailPayload, paymentStatus: "pending" });
      if (env.ADMIN_ORDER_NOTIFICATION_EMAIL) {
        await sendAdminNewOrderEmail(env.ADMIN_ORDER_NOTIFICATION_EMAIL, orderEmailPayload);
      }
    } catch (emailErr) {
      console.error("[EMAIL] checkout order emails failed", emailErr);
    }
  } catch (e) {
    console.error(e);
    if (e instanceof Error && e.message === "CRYPTO_CHECKOUT_MISCONFIG") {
      return { error: cryptoCheckoutMisconfigMessage() };
    }
    return { error: "Could not create order. Please try again or contact support." };
  }

  if (btcpayCheckoutResult) {
    return { btcpayCheckout: btcpayCheckoutResult };
  }
  if (paymentoGatewayUrlToRedirect) {
    redirect(paymentoGatewayUrlToRedirect);
  }
  if (cardWidgetUrl?.startsWith("http")) {
    redirect(cardWidgetUrl);
  }
  redirect(`/order/${orderNumberOut!}/confirmation`);
}
