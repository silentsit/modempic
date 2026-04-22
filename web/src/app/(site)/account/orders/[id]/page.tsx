import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/domain/money";
import { format } from "date-fns";

type Props = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const order = await prisma.order.findFirst({
    where: { id, userId: session!.user.id },
    include: { lines: true, shippingAddress: true, billingAddress: true, payments: true },
  });
  if (!order) notFound();

  return (
    <div>
      <p className="text-sm text-[var(--muted-foreground)]">
        <Link href="/account/orders" className="hover:underline">
          ← All orders
        </Link>
      </p>
      <h2 className="mt-2 text-xl font-semibold">Order {order.orderNumber}</h2>
      <p className="text-sm text-[var(--muted-foreground)]">{format(order.createdAt, "MMMM d, yyyy h:mm a")}</p>
      <p className="mt-1 text-sm">
        Status: <strong>{order.status.replace("_", " ")}</strong>
      </p>
      {order.shippingAddress ? (
        <div className="mt-6 text-sm">
          <h3 className="font-medium">Ship to</h3>
          <p className="mt-1 text-[var(--muted-foreground)]">
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? (
              <>
                <br />
                {order.shippingAddress.line2}
              </>
            ) : null}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal}
          </p>
        </div>
      ) : null}
      <ul className="mt-6 divide-y divide-[var(--border)]">
        {order.lines.map((l) => (
          <li key={l.id} className="flex justify-between py-2 text-sm">
            <span>
              {l.title} × {l.quantity}
            </span>
            <span>{formatUsd(l.lineTotalCents)}</span>
          </li>
        ))}
        <li className="flex justify-between py-2 font-semibold">
          <span>Total</span>
          <span>{formatUsd(order.totalCents)}</span>
        </li>
      </ul>
    </div>
  );
}
