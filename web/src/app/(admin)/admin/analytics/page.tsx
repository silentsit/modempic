import { revenueByDayLast30, topProducts, topCategories, getAdminKpis } from "@/lib/data/admin-analytics";
import { formatUsd } from "@/lib/domain/money";
import { AnalyticsCharts } from "./charts";

export default async function AdminAnalyticsPage() {
  const [kpi, series, prods, cats] = await Promise.all([getAdminKpis(), revenueByDayLast30(), topProducts(), topCategories()]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics & reporting</h1>
      <p className="text-sm text-[var(--muted-foreground)]">USD · structure/function claims stay on storefront copy</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border p-3 text-sm">
          <p className="text-[var(--muted-foreground)]">Net sales</p>
          <p className="text-lg font-semibold">{formatUsd(kpi.netSalesCents)}</p>
        </div>
        <div className="rounded-lg border p-3 text-sm">
          <p className="text-[var(--muted-foreground)]">Paid orders</p>
          <p className="text-lg font-semibold">{kpi.orderCount}</p>
        </div>
        <div className="rounded-lg border p-3 text-sm">
          <p className="text-[var(--muted-foreground)]">AOV</p>
          <p className="text-lg font-semibold">{formatUsd(kpi.aovCents)}</p>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Revenue & orders (30 days, paid)</h2>
        <AnalyticsCharts series={series} />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Top products</h2>
          <ol className="mt-2 list-decimal pl-5 text-sm">
            {prods.map((p) => (
              <li key={p.slug} className="py-0.5">
                {p.name} — {formatUsd(p.rev)} · {p.qty} units
              </li>
            ))}
            {prods.length === 0 ? <p className="text-[var(--muted-foreground)]">No paid data yet</p> : null}
          </ol>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Top categories (allocated)</h2>
          <ol className="mt-2 list-decimal pl-5 text-sm">
            {cats.map((c) => (
              <li key={c.name} className="py-0.5">
                {c.name} — {formatUsd(c.rev)}
              </li>
            ))}
            {cats.length === 0 ? <p className="text-[var(--muted-foreground)]">No paid data yet</p> : null}
          </ol>
        </div>
      </div>
    </div>
  );
}
