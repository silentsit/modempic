import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/domain/money";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { SimulatePayButton } from "./simulate";
import { BtcpayOrderPaySection } from "./btcpay-pay-section";
import { PaymentStatus, OrderStatus } from "@prisma/client";
import { getBtcpayPublicUrl } from "@/lib/payments/btcpay";
import { getSiteUrl } from "@/lib/site-url";

type Props = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ pay?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber}` };
}

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { orderNumber } = await params;
  const sp = await searchParams;
  const autoOpenBtcpay = sp.pay === "1";
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: session.user.id },
    include: {
      lines: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const pay = order.payments[0];
  const btcpayUrl = getBtcpayPublicUrl();
  const confirmationUrl = `${getSiteUrl()}/order/${order.orderNumber}/confirmation`;

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Thanks for your order</h1>
      <p className="mt-2 text-[var(--muted-foreground)]">
        Order <strong className="text-[var(--foreground)]">{order.orderNumber}</strong> — status:{" "}
        <strong>{order.status.replace("_", " ")}</strong>
      </p>
      {pay &&
      pay.status === PaymentStatus.PENDING &&
      pay.method === "CRYPTO" &&
      pay.provider === "btcpay" &&
      pay.externalId &&
      pay.payAddress?.startsWith("http") &&
      btcpayUrl ? (
        <BtcpayOrderPaySection
          invoiceId={pay.externalId}
          checkoutLink={pay.payAddress}
          confirmationUrl={confirmationUrl}
          btcpayUrl={btcpayUrl}
          autoOpen={autoOpenBtcpay}
        />
      ) : null}
      {pay && pay.status === PaymentStatus.PENDING && pay.method === "CRYPTO" && pay.provider === "paymento" && pay.payAddress?.startsWith("http") ? (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">Complete crypto payment (Paymento)</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Paymento sends funds to the merchant wallet you configured in the Paymento dashboard. You will return here
            after payment; we also process Paymento&rsquo;s instant notification to mark the order paid.
          </p>
          <Button className="mt-4" asChild>
            <a href={pay.payAddress} rel="noopener noreferrer" target="_blank">
              Open Paymento checkout
            </a>
          </Button>
        </div>
      ) : null}
      {pay && pay.status === PaymentStatus.PENDING && pay.method === "CRYPTO" && pay.provider === "crypto_sim" && pay.payAddress ? (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">Pay with crypto (simulator)</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Development only: a simulated pay-in address. In production, configure Paymento to receive real crypto
            payments.
          </p>
          <p className="mt-2 break-all font-mono text-sm">
            <span className="text-[var(--muted-foreground)]">Address: </span>
            {pay.payAddress}
          </p>
          {pay.expiresAt ? (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Expires: {pay.expiresAt.toISOString()}</p>
          ) : null}
          <SimulatePayButton orderNumber={order.orderNumber} canSimulate={process.env.DEV_PAYMENT_SIMULATE === "1" || process.env.NODE_ENV === "development"} />
        </div>
      ) : null}
      {pay &&
      (pay.status === PaymentStatus.SUCCEEDED || order.status === OrderStatus.PROCESSING) &&
      pay.provider === "btcpay" &&
      order.status !== OrderStatus.COMPLETED ? (
        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
          Payment received — waiting for blockchain confirmation. Your order will update automatically; no action needed.
        </div>
      ) : null}
      {pay && pay.status === PaymentStatus.REQUIRES_ACTION && pay.method === "CARD_ONRAMP" ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Complete the on-ramp in the partner flow to pay for this order. Order stays pending until the partner
          confirms.
        </div>
      ) : null}
      <ul className="mt-8 max-w-2xl space-y-2 border-t border-[var(--border)] pt-6">
        {order.lines.map((l) => (
          <li key={l.id} className="flex justify-between text-sm">
            <span>
              {l.title} × {l.quantity}
            </span>
            <span>{formatUsd(l.lineTotalCents)}</span>
          </li>
        ))}
        <li className="flex justify-between border-t border-[var(--border)] pt-2 font-semibold">
          <span>Total</span>
          <span>{formatUsd(order.totalCents)}</span>
        </li>
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/account/orders">View orders</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    </Container>
  );
}
