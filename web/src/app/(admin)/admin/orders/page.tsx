import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/domain/money";
import { format } from "date-fns";
import { OrderStatus } from "@prisma/client";
import { setOrderStatusAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { email: true } } } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="mt-4 space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
            <p className="font-medium">
              {o.orderNumber} · {o.user.email} · {format(o.createdAt, "MMM d yy HH:mm")}
            </p>
            <p className="text-[var(--muted-foreground)]">
              {formatUsd(o.totalCents)} — {o.status}
            </p>
            {o.adminNote ? <p className="text-xs">Note: {o.adminNote}</p> : null}
            <form action={setOrderStatusAction} className="mt-2 flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={o.id} />
              <select name="status" className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" defaultValue={o.status}>
                {Object.values(OrderStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" variant="secondary">
                Update status
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
