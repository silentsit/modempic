import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/domain/money";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { SimulatePayButton } from "./simulate";
import { ConfirmationStatus } from "./confirmation-status";
import { PaymentStatus } from "@prisma/client";
import { guestCanAccessOrder } from "@/lib/cart/owner";
import { isReusableGatewayUrl } from "@/lib/checkout/checkout-payment-sessions";

type Props = { params: Promise<{ orderNumber: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Order ${orderNumber}`,
    robots: { index: false, follow: false },
  };
}

export default async function OrderConfirmationPage({ params }: Props) {
  const session = await auth();
  const { orderNumber } = await params;
  const guestAccess = await guestCanAccessOrder(orderNumber);
  if (!session?.user?.id && !guestAccess) redirect("/login");

  const order = await prisma.order.findFirst({
    where: session?.user?.id ? { orderNumber, userId: session.user.id } : { orderNumber },
    include: {
      lines: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const pay = order.payments[0];

  return (
    <Container className="py-10 sm:py-14">
      <ConfirmationStatus
        orderNumber={order.orderNumber}
        initialOrderStatus={order.status}
        initialPaymentStatus={pay?.status ?? null}
        initialProvider={pay?.provider ?? null}
        initialPayAddress={isReusableGatewayUrl(pay?.payAddress, pay?.expiresAt) ? pay?.payAddress ?? null : null}
      />
      {pay && pay.status === PaymentStatus.PENDING && pay.method === "CRYPTO" && pay.provider === "crypto_sim" && pay.payAddress ? (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">Pay with Crypto (Simulator)</h2>
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
        {session?.user?.id ? (
          <Button asChild>
            <Link href="/account/orders">View orders</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/login?callbackUrl=/account/orders">Create an account to track orders</Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    </Container>
  );
}
