import {
  CryptoAsset,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { createSimulatedCryptoPayment } from "@/lib/payments/crypto-simulate";
import { createGuardarianSession } from "@/lib/payments/guardarian-adapter";
import type { CryptoCheckoutProvider } from "@/lib/payments/crypto-provider";
import { checkoutShippingMethodLabel } from "@/lib/domain/checkout-pricing";
import { defersCartClearUntilGateway } from "@/lib/checkout/checkout-cart";
import type { CheckoutFormValue } from "@/lib/checkout/checkout-form";

export type CheckoutOrderLineCreate = {
  productId: string;
  title: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  variantId?: string | null;
  variantKey?: string | null;
  variantLabel?: string | null;
  sku?: string | null;
};

export type CheckoutAttribution = {
  originSource: string | null;
  originReferrer: string | null;
  deviceType: string | null;
  customerIp: string | null;
};

export type CreateCheckoutOrderInput = {
  userId: string;
  email: string;
  orderNumber: string;
  cartId: string;
  shipAddr: CheckoutFormValue["ship"];
  billAddr: CheckoutFormValue["bill"];
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  couponId?: string;
  orderNotes?: string;
  attribution: CheckoutAttribution;
  lineCreates: CheckoutOrderLineCreate[];
  paymentMethod: "CRYPTO" | "CARD_ONRAMP";
  cryptoProvider: CryptoCheckoutProvider | null;
  asset?: CryptoAsset;
};

export type CreateCheckoutOrderResult = {
  order: Order;
  cardWidgetUrl?: string;
};

export async function createCheckoutOrderInTransaction(
  input: CreateCheckoutOrderInput,
): Promise<CreateCheckoutOrderResult> {
  let cardWidgetUrl: string | undefined;

  const order = await prisma.$transaction(async (tx) => {
    const ship = await tx.address.create({
      data: { userId: input.userId, label: "Shipping", ...input.shipAddr },
    });
    const bill = await tx.address.create({
      data: { userId: input.userId, label: "Billing", ...input.billAddr },
    });
    const o = await tx.order.create({
      data: {
        orderNumber: input.orderNumber,
        userId: input.userId,
        status: OrderStatus.PENDING_PAYMENT,
        subtotalCents: input.subtotalCents,
        taxCents: input.taxCents,
        shippingCents: input.shippingCents,
        discountCents: input.discountCents,
        totalCents: input.totalCents,
        currency: "USD",
        shippingAddressId: ship.id,
        billingAddressId: bill.id,
        shippingMethod: checkoutShippingMethodLabel(input.shippingCents),
        originSource: input.attribution.originSource,
        originReferrer: input.attribution.originReferrer,
        deviceType: input.attribution.deviceType,
        customerIp: input.attribution.customerIp,
        couponId: input.couponId,
        notes: input.orderNotes ?? undefined,
        lines: { create: input.lineCreates },
      },
    });

    if (input.paymentMethod === "CRYPTO" && input.cryptoProvider === "sim") {
      const sim = createSimulatedCryptoPayment({
        orderId: o.id,
        amountCents: input.totalCents,
        asset: input.asset ?? CryptoAsset.USDT,
      });
      const pay = await tx.payment.create({
        data: {
          orderId: o.id,
          method: PaymentMethod.CRYPTO,
          status: PaymentStatus.PENDING,
          idempotencyKey: sim.idempotencyKey,
          amountCents: input.totalCents,
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
    } else if (
      input.paymentMethod === "CRYPTO" &&
      defersCartClearUntilGateway(input.paymentMethod, input.cryptoProvider)
    ) {
      // BTCPay / Paymento: payment record + cart clear after external gateway succeeds.
    } else if (input.paymentMethod === "CRYPTO") {
      throw new Error("CRYPTO_CHECKOUT_MISCONFIG");
    } else {
      const g = createGuardarianSession({
        orderId: o.id,
        orderNumber: o.orderNumber,
        amountCents: input.totalCents,
        email: input.email,
      });
      cardWidgetUrl = g.widgetUrl;
      const pay = await tx.payment.create({
        data: {
          orderId: o.id,
          method: PaymentMethod.CARD_ONRAMP,
          status: PaymentStatus.REQUIRES_ACTION,
          idempotencyKey: g.idempotencyKey,
          amountCents: input.totalCents,
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

    if (!defersCartClearUntilGateway(input.paymentMethod, input.cryptoProvider)) {
      await tx.cartLine.deleteMany({ where: { cartId: input.cartId } });
    }
    return o;
  });

  return { order, cardWidgetUrl };
}
