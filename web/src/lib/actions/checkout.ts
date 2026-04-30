"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CryptoAsset, OrderStatus, PaymentMethod, PaymentStatus, ProductStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createSimulatedCryptoPayment } from "@/lib/payments/crypto-simulate";
import { createGuardarianSession } from "@/lib/payments/guardarian-adapter";
import {
  isPaymentoConfigured,
  paymentoCreatePaymentRequest,
  paymentoGatewayUrl,
  getPaymentoSpeedFromEnv,
} from "@/lib/payments/paymento";
import { getSiteUrl } from "@/lib/site-url";
import { sendOrderPlacedEmail } from "@/lib/email/send";
import { z } from "zod";

function allowCryptoSimulator(): boolean {
  return process.env.DEV_PAYMENT_SIMULATE === "1" || process.env.NODE_ENV === "development";
}

const addr = z.object({
  fullName: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(2),
  postal: z.string().min(3).max(20),
  phone: z.string().max(30).optional(),
});

function genOrderNumber() {
  return `MP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const checkoutSchema = z
  .object({
    paymentMethod: z.enum(["CRYPTO", "CARD_ONRAMP"]),
    asset: z.nativeEnum(CryptoAsset).optional(),
    couponCode: z.string().max(32).optional(),
    billSame: z.boolean(),
    ship: addr,
    bill: addr.optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.billSame && !data.bill) {
      ctx.addIssue({ code: "custom", message: "billing", path: ["bill"] });
    }
  });

export type CheckoutState = { error: string } | null;

function parseForm(fd: FormData) {
  const billSame = fd.get("billSame") === "on";
  const ship = {
    fullName: String(fd.get("shipFullName") ?? ""),
    line1: String(fd.get("shipLine1") ?? ""),
    line2: String(fd.get("shipLine2") ?? "") || undefined,
    city: String(fd.get("shipCity") ?? ""),
    state: String(fd.get("shipState") ?? ""),
    postal: String(fd.get("shipPostal") ?? ""),
    phone: String(fd.get("shipPhone") ?? "") || undefined,
  };
  const bill = billSame
    ? undefined
    : {
        fullName: String(fd.get("billFullName") ?? ""),
        line1: String(fd.get("billLine1") ?? ""),
        line2: String(fd.get("billLine2") ?? "") || undefined,
        city: String(fd.get("billCity") ?? ""),
        state: String(fd.get("billState") ?? ""),
        postal: String(fd.get("billPostal") ?? ""),
        phone: String(fd.get("billPhone") ?? "") || undefined,
      };
  const assetStr = String(fd.get("asset") ?? "USDT");
  const asset = (CryptoAsset as Record<string, CryptoAsset>)[assetStr] ?? CryptoAsset.USDT;
  return checkoutSchema.safeParse({
    paymentMethod: fd.get("paymentMethod") === "CARD_ONRAMP" ? "CARD_ONRAMP" : "CRYPTO",
    asset,
    couponCode: String(fd.get("couponCode") ?? "").trim() || undefined,
    billSame,
    ship,
    bill,
  });
}

export async function submitCheckoutAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };
  const userId = session.user.id;
  const email = session.user.email;
  if (!email) return { error: "Your account needs an email to checkout." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Check addresses and try again." };
  }
  const v = parsed.data;
  if (!v.billSame && !v.bill) return { error: "Enter billing address or use same as shipping." };

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });
  if (!cart?.items.length) return { error: "Your cart is empty." };

  let subtotalCents = 0;
  const lineCreates: { productId: string; title: string; unitPriceCents: number; quantity: number; lineTotalCents: number }[] = [];
  for (const line of cart.items) {
    if (line.product.status !== ProductStatus.PUBLISHED) {
      return { error: `Product unavailable: ${line.product.name}` };
    }
    const unitCents = line.unitPriceCents;
    const lineTotal = unitCents * line.quantity;
    subtotalCents += lineTotal;
    lineCreates.push({
      productId: line.productId,
      title: line.product.name,
      unitPriceCents: unitCents,
      quantity: line.quantity,
      lineTotalCents: lineTotal,
    });
  }

  let discountCents = 0;
  let couponId: string | undefined;
  if (v.couponCode) {
    const c = await prisma.coupon.findUnique({ where: { code: v.couponCode } });
    const now = new Date();
    if (c?.active) {
      const okTime = (!c.startsAt || c.startsAt <= now) && (!c.endsAt || c.endsAt >= now);
      const okMin = subtotalCents >= c.minOrderCents;
      const okCount = c.maxRedemptions == null || c.redemptionCount < c.maxRedemptions;
      if (okTime && okMin && okCount) {
        if (c.type === "PERCENT") {
          discountCents = Math.min(subtotalCents, Math.floor((subtotalCents * c.value) / 100));
        } else {
          discountCents = Math.min(subtotalCents, c.value);
        }
        couponId = c.id;
      }
    }
  }

  const shippingCents = subtotalCents >= 5000 ? 0 : 599;
  const taxCents = Math.round((subtotalCents - discountCents) * 0.06);
  const totalCents = subtotalCents + taxCents + shippingCents - discountCents;
  if (totalCents < 0) return { error: "Invalid total." };

  const orderNumberOut = genOrderNumber();
  const shipAddr = v.ship;
  const billAddr = v.billSame ? shipAddr : v.bill!;

  const baseUrl = getSiteUrl();
  const returnUrl = `${baseUrl}/order/${orderNumberOut}/confirmation`;

  let cardWidgetUrl: string | undefined;
  let paymentoGatewayUrlToRedirect: string | undefined;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const ship = await tx.address.create({
        data: { userId, label: "Shipping", country: "US", ...shipAddr },
      });
      const bill = await tx.address.create({
        data: { userId, label: "Billing", country: "US", ...billAddr },
      });
      if (couponId) {
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
          couponId,
          lines: { create: lineCreates },
        },
      });
      if (v.paymentMethod === "CRYPTO" && isPaymentoConfigured()) {
        await tx.cartLine.deleteMany({ where: { cartId: cart.id } });
        return o;
      }
      if (v.paymentMethod === "CRYPTO" && allowCryptoSimulator()) {
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

      await tx.cartLine.deleteMany({ where: { cartId: cart.id } });
      return o;
    });

    if (v.paymentMethod === "CRYPTO" && isPaymentoConfigured()) {
      const pr = await paymentoCreatePaymentRequest({
        fiatAmount: (totalCents / 100).toFixed(2),
        fiatCurrency: "USD",
        orderId: orderNumberOut,
        returnUrl,
        speed: getPaymentoSpeedFromEnv(),
        emailAddress: email,
        additionalData: [{ key: "internalOrderId", value: order.id }],
      });
      if (!pr.success) {
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
    }
  } catch (e) {
    console.error(e);
    if (e instanceof Error && e.message === "CRYPTO_CHECKOUT_MISCONFIG") {
      return {
        error:
          "Crypto checkout is not available: set PAYMENTO_API_KEY and PAYMENTO_SECRET_KEY (and configure IPN), or use development mode for the built-in simulator.",
      };
    }
    return { error: "Could not create order. Please try again or contact support." };
  }

  revalidatePath("/account");
  await sendOrderPlacedEmail(email, {
    orderNumber: orderNumberOut!,
    totalCents,
    lines: lineCreates.map((l) => ({
      title: l.title,
      quantity: l.quantity,
      lineTotalCents: l.lineTotalCents,
    })),
    paymentStatus: "pending",
  });

  if (paymentoGatewayUrlToRedirect) {
    redirect(paymentoGatewayUrlToRedirect);
  }
  if (cardWidgetUrl?.startsWith("http")) {
    redirect(cardWidgetUrl);
  }
  redirect(`/order/${orderNumberOut!}/confirmation`);
}
