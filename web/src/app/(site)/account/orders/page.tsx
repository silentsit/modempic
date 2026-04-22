import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/domain/money";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const session = await auth();
  const orders = await prisma.order.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold">Orders</h2>
      {orders.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">You have not placed an order yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
          {orders.map((o) => (
            <li key={o.id} className="px-4 py-3">
              <Link href={`/account/orders/${o.id}`} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-[var(--primary)] hover:underline">{o.orderNumber}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{format(o.createdAt, "MMMM d, yyyy h:mm a")}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-medium">{formatUsd(o.totalCents)}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{o.status.replace("_", " ")}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
