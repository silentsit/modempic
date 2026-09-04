import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PaymentStatus } from "@prisma/client";
import { auth } from "@/auth";
import { loadAccessibleCheckoutOrder } from "@/lib/checkout/checkout-order-access";
import { Container } from "@/components/site/container";
import { CheckoutProgress } from "../checkout-progress";
import { CheckoutTrustStrip } from "../checkout-trust-strip";
import { CheckoutFooterTrust } from "../checkout-footer-trust";
import { PaymentHandoffClient } from "./payment-handoff-client";

export const metadata: Metadata = {
  title: "Secure Payment",
  robots: { index: false, follow: false },
};

type Search = { order?: string };

export default async function CheckoutPaymentPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { order: orderNumber } = await searchParams;
  const trimmed = orderNumber?.trim() ?? "";
  if (!trimmed) redirect("/checkout");

  const session = await auth();
  const order = await loadAccessibleCheckoutOrder(trimmed);
  if (!order) {
    if (!session?.user?.id) redirect("/login?callbackUrl=/checkout");
    notFound();
  }

  const pay = order.payments[0];
  if (!pay || pay.status === PaymentStatus.SUCCEEDED || (pay.provider !== "peptidepay" && pay.provider !== "paymento")) {
    redirect(`/order/${order.orderNumber}/confirmation`);
  }

  const methodLabel =
    pay.provider === "paymento" ? "Cryptocurrency on Paymento" : "Card, Apple Pay, or Google Pay";

  return (
    <div className="bg-background pb-20">
      <Container className="pt-10 sm:pt-12">
        <div className="flex flex-col gap-6 border-b border-border pb-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Complete payment</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your order is saved. Next step is the hosted payment page.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:items-end">
            <CheckoutProgress current="finish" />
            <CheckoutTrustStrip />
          </div>
        </div>

        <PaymentHandoffClient
          orderNumber={order.orderNumber}
          totalCents={order.totalCents}
          methodLabel={methodLabel}
        />

        <CheckoutFooterTrust />
      </Container>
    </div>
  );
}
