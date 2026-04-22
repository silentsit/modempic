import { getAdminKpis } from "@/lib/data/admin-analytics";
import { formatUsd } from "@/lib/domain/money";

export default async function AdminDashboard() {
  const k = await getAdminKpis();
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">Key metrics for paid orders</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs uppercase text-[var(--muted-foreground)]">Total sales (paid)</p>
          <p className="mt-1 text-2xl font-semibold">{formatUsd(k.totalSalesCents)}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs uppercase text-[var(--muted-foreground)]">Net (after discount)</p>
          <p className="mt-1 text-2xl font-semibold">{formatUsd(k.netSalesCents)}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs uppercase text-[var(--muted-foreground)]">Orders (paid / all)</p>
          <p className="mt-1 text-2xl font-semibold">
            {k.orderCount} / {k.allOrders}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs uppercase text-[var(--muted-foreground)]">AOV (paid)</p>
          <p className="mt-1 text-2xl font-semibold">{formatUsd(k.aovCents)}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs uppercase text-[var(--muted-foreground)]">Items sold (paid lines)</p>
          <p className="mt-1 text-2xl font-semibold">{k.itemsSold}</p>
        </div>
      </div>
    </div>
  );
}
