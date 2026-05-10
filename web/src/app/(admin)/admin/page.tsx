import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  BarChart3,
  Boxes,
  ListChecks,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { OrderStatus } from "@prisma/client";
import {
  getActivitySummary,
  getAdminKpis,
  getRecentOrders,
  revenueByDayLast30,
  topCategories,
  topProducts,
} from "@/lib/data/admin-analytics";
import { formatUsd } from "@/lib/domain/money";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const statusStyles: Record<OrderStatus, string> = {
  DRAFT: "bg-[#dde7f3] text-[#1c4a87]",
  PENDING_PAYMENT: "bg-[#e0e0e3] text-[#3c434a]",
  PROCESSING: "bg-[#dcf2dd] text-[#0a6b3b]",
  ON_HOLD: "bg-[#fcf0d2] text-[#8a6a08]",
  COMPLETED: "bg-[#dcf2dd] text-[#0a6b3b]",
  CANCELLED: "bg-[#e0e0e3] text-[#3c434a]",
  REFUNDED: "bg-[#f1e4f6] text-[#7d2a92]",
  FAILED: "bg-[#fde2e1] text-[#a82220]",
};

const statusLabels: Record<OrderStatus, string> = {
  DRAFT: "Draft",
  PENDING_PAYMENT: "Pending payment",
  PROCESSING: "Processing",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

function statusLabel(s: OrderStatus) {
  return statusLabels[s] ?? s;
}

function Sparkline({ values }: { values: number[] }) {
  if (!values.length) {
    return (
      <div className="flex h-10 items-center justify-center rounded-md bg-[#f6f7f7] text-[10px] text-[#8c8f94]">
        No paid orders yet
      </div>
    );
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 32;
  const step = values.length > 1 ? w / (values.length - 1) : 0;
  const pts = values
    .map((v, i) => `${(i * step).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`)
    .join(" ");
  const areaPts = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2271b1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2271b1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill="url(#spark-fill)" />
      <polyline points={pts} fill="none" stroke="#2271b1" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[#dcdcde] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-2.5 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        {hint ? (
          <span className="rounded-full bg-[#f6f7f7] px-2 py-0.5 text-[10px] font-medium text-[#50575e]">{hint}</span>
        ) : null}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-[#50575e]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#1d2327]">{value}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const [k, revenue, products, categories, recentOrders, activity] = await Promise.all([
    getAdminKpis(),
    revenueByDayLast30(),
    topProducts(),
    topCategories(),
    getRecentOrders(8),
    getActivitySummary(),
  ]);

  const sparkValues = revenue.map((r) => r.revenueCents);
  const last30Total = revenue.reduce((sum, r) => sum + r.revenueCents, 0);
  const last30Orders = revenue.reduce((sum, r) => sum + r.orders, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1d2327] sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-[#50575e]">A quick look at sales, activity, and what needs your attention.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#2271b1] px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#135e96]"
          >
            <Plus className="h-4 w-4" />
            Add product
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#dcdcde] bg-white px-3 py-2 text-sm font-medium text-[#2271b1] hover:bg-[#f6f7f7]"
          >
            View orders
          </Link>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#dcdcde] bg-white px-3 py-2 text-sm font-medium text-[#2271b1] hover:bg-[#f6f7f7]"
          >
            <BarChart3 className="h-4 w-4" />
            Full analytics
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Gross sales"
          value={formatUsd(k.totalSalesCents)}
          icon={Banknote}
          accent="bg-[#dcf2dd] text-[#0a6b3b]"
          hint="Lifetime"
        />
        <KpiCard
          label="Net sales"
          value={formatUsd(k.netSalesCents)}
          icon={TrendingUp}
          accent="bg-[#dde7f3] text-[#1c4a87]"
          hint="After discount"
        />
        <KpiCard
          label="Paid / total orders"
          value={`${k.orderCount} / ${k.allOrders}`}
          icon={ShoppingCart}
          accent="bg-[#fcf0d2] text-[#8a6a08]"
        />
        <KpiCard
          label="Avg. order value"
          value={formatUsd(k.aovCents)}
          icon={Sparkles}
          accent="bg-[#f1e4f6] text-[#7d2a92]"
          hint={`${k.itemsSold} items sold`}
        />
      </div>

      {/* Revenue card + Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-[#dcdcde] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#50575e]">Revenue · last 30 days</p>
              <p className="mt-1 text-2xl font-semibold text-[#1d2327]">{formatUsd(last30Total)}</p>
              <p className="mt-1 text-xs text-[#50575e]">
                {last30Orders} paid order{last30Orders === 1 ? "" : "s"}
              </p>
            </div>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#2271b1] hover:underline"
            >
              Details
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4">
            <Sparkline values={sparkValues} />
          </div>
        </div>

        <div className="rounded-xl border border-[#dcdcde] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-[#50575e]" />
            <p className="text-xs font-medium uppercase tracking-wider text-[#50575e]">Needs your attention</p>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <Link href="/admin/orders?status=PENDING_PAYMENT" className="flex items-center gap-2 text-[#2271b1] hover:underline">
                <ShoppingCart className="h-4 w-4" />
                Pending payments
              </Link>
              <span className="rounded-full bg-[#fcf0d2] px-2 py-0.5 text-xs font-semibold text-[#8a6a08]">
                {activity.pendingOrders}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <Link href="/admin/reviews" className="flex items-center gap-2 text-[#2271b1] hover:underline">
                <Star className="h-4 w-4" />
                Reviews to moderate
              </Link>
              <span className="rounded-full bg-[#fde2e1] px-2 py-0.5 text-xs font-semibold text-[#a82220]">
                {activity.pendingReviews}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <Link href="/admin/contacts" className="flex items-center gap-2 text-[#2271b1] hover:underline">
                <Users className="h-4 w-4" />
                Open contact messages
              </Link>
              <span className="rounded-full bg-[#dde7f3] px-2 py-0.5 text-xs font-semibold text-[#1c4a87]">
                {activity.pendingContacts}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <Link href="/admin/products?status=DRAFT" className="flex items-center gap-2 text-[#2271b1] hover:underline">
                <Package className="h-4 w-4" />
                Draft products
              </Link>
              <span className="rounded-full bg-[#e0e0e3] px-2 py-0.5 text-xs font-semibold text-[#3c434a]">
                {activity.draftProducts}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#1d2327]">
                <Boxes className="h-4 w-4" />
                Active carts
              </span>
              <span className="rounded-full bg-[#dcf2dd] px-2 py-0.5 text-xs font-semibold text-[#0a6b3b]">
                {activity.openCarts}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Recent orders + Top products */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-[#dcdcde] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between border-b border-[#dcdcde] px-5 py-3.5">
            <div>
              <p className="text-sm font-semibold text-[#1d2327]">Recent orders</p>
              <p className="text-xs text-[#50575e]">Last {recentOrders.length} orders</p>
            </div>
            <Link href="/admin/orders" className="text-xs font-medium text-[#2271b1] hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#dcdcde] bg-[#f6f7f7] text-[11px] uppercase tracking-wider text-[#50575e]">
                  <th className="px-4 py-2.5 font-medium">Order</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Items</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5 font-medium">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f1]">
                {recentOrders.length ? (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="transition-colors hover:bg-[#f9fafa]">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-medium text-[#2271b1] hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#1d2327]">
                        <p className="truncate">{o.customerName ?? "Guest"}</p>
                        <p className="truncate text-xs text-[#50575e]">{o.customerEmail ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-[#50575e]">{o.itemCount}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[o.status]}`}>
                          {statusLabel(o.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#1d2327]">
                        {formatUsd(o.totalCents)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#50575e]">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#50575e]">
                      No orders yet — once customers check out, they will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-[#dcdcde] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between border-b border-[#dcdcde] px-5 py-3.5">
            <div>
              <p className="text-sm font-semibold text-[#1d2327]">Top products</p>
              <p className="text-xs text-[#50575e]">By paid revenue</p>
            </div>
            <Link href="/admin/products" className="text-xs font-medium text-[#2271b1] hover:underline">
              All
            </Link>
          </div>
          <ul className="divide-y divide-[#f0f0f1]">
            {products.length ? (
              products.slice(0, 6).map((p, i) => (
                <li key={p.slug} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f6f7f7] text-xs font-semibold text-[#50575e]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1d2327]">{p.name}</p>
                    <p className="text-xs text-[#50575e]">{p.qty} sold</p>
                  </div>
                  <p className="text-sm font-semibold text-[#1d2327]">{formatUsd(p.rev)}</p>
                </li>
              ))
            ) : (
              <li className="px-5 py-10 text-center text-sm text-[#50575e]">No paid sales yet.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Top categories */}
      <div className="rounded-xl border border-[#dcdcde] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#1d2327]">Top categories</p>
          <Link href="/admin/analytics" className="text-xs font-medium text-[#2271b1] hover:underline">
            Details
          </Link>
        </div>
        {categories.length ? (
          <div className="mt-4 space-y-3">
            {(() => {
              const max = Math.max(...categories.map((c) => c.rev), 1);
              return categories.map((c) => {
                const pct = Math.round((c.rev / max) * 100);
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-sm">
                      <p className="truncate font-medium text-[#1d2327]">{c.name}</p>
                      <p className="text-xs text-[#50575e]">{formatUsd(c.rev)}</p>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#f0f0f1]">
                      <div
                        className="h-full rounded-full bg-[#2271b1]"
                        style={{ width: `${pct}%` }}
                        aria-hidden
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#50575e]">No category sales yet.</p>
        )}
      </div>
    </div>
  );
}