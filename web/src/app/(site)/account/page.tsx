import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/domain/money";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Account overview" };

export default async function AccountOverviewPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [recent, count] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return (
    <div>
      <h2 className="text-xl font-semibold">Overview</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Signed in as {session?.user?.email} · {count} order{count === 1 ? "" : "s"}
      </p>
      <h3 className="mt-8 text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Recent activity</h3>
      {recent.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">No orders yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
          {recent.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{o.orderNumber}</p>
                <p className="text-[var(--muted-foreground)]">{format(o.createdAt, "MMM d, yyyy")}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatUsd(o.totalCents)}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{o.status.replace("_", " ")}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <Button variant="outline" asChild>
          <Link href="/account/orders">View all orders</Link>
        </Button>
      </div>
    </div>
  );
}
