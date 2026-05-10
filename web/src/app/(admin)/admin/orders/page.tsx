import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Mail, MoreHorizontal } from "lucide-react";
import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";
import { formatUsd } from "@/lib/domain/money";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 20;

const statusMeta: Record<
  OrderStatus,
  { label: string; pill: string }
> = {
  DRAFT: { label: "Draft", pill: "bg-[#dde7f3] text-[#1c4a87]" },
  PENDING_PAYMENT: { label: "Pending payment", pill: "bg-[#e0e0e3] text-[#3c434a]" },
  PROCESSING: { label: "Processing", pill: "bg-[#dcf2dd] text-[#0a6b3b]" },
  ON_HOLD: { label: "On hold", pill: "bg-[#fcf0d2] text-[#8a6a08]" },
  COMPLETED: { label: "Completed", pill: "bg-[#dde7f3] text-[#1c4a87]" },
  CANCELLED: { label: "Cancelled", pill: "bg-[#e0e0e3] text-[#3c434a]" },
  REFUNDED: { label: "Refunded", pill: "bg-[#f1e4f6] text-[#7d2a92]" },
  FAILED: { label: "Failed", pill: "bg-[#fde2e1] text-[#a82220]" },
};

const statusOrder: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PROCESSING,
  OrderStatus.ON_HOLD,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.FAILED,
];

function getParam(p: Awaited<SearchParams>, k: string) {
  const v = p[k];
  return Array.isArray(v) ? v[0] : v;
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

function dateRange(from?: string, to?: string) {
  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : null;
  if (end) end.setHours(23, 59, 59, 999);
  return { start: start && !Number.isNaN(start.getTime()) ? start : null, end: end && !Number.isNaN(end.getTime()) ? end : null };
}

export default async function AdminOrdersPage({ searchParams }: { searchParams?: SearchParams }) {
  const p = searchParams ? await searchParams : {};
  const status = getParam(p, "status") as OrderStatus | "" | undefined;
  const activeStatus = status && statusMeta[status as OrderStatus] ? (status as OrderStatus) : "";
  const search = (getParam(p, "s") ?? "").trim();
  const customer = (getParam(p, "customer") ?? "").trim();
  const txid = (getParam(p, "txid") ?? "").trim();
  const channel = getParam(p, "channel") ?? "";
  const from = getParam(p, "from");
  const to = getParam(p, "to");
  const page = Math.max(1, parseInt(getParam(p, "page") ?? "1", 10) || 1);

  const { start, end } = dateRange(from, to);

  const where: Prisma.OrderWhereInput = {
    ...(activeStatus ? { status: activeStatus } : {}),
    ...(start || end
      ? {
          createdAt: {
            ...(start ? { gte: start } : {}),
            ...(end ? { lte: end } : {}),
          },
        }
      : {}),
    ...(customer
      ? {
          user: {
            OR: [
              { email: { contains: customer, mode: "insensitive" } },
              { name: { contains: customer, mode: "insensitive" } },
            ],
          },
        }
      : {}),
    ...(txid
      ? {
          payments: {
            some: {
              OR: [
                { externalId: { contains: txid, mode: "insensitive" } },
                { payAddress: { contains: txid, mode: "insensitive" } },
                { idempotencyKey: { contains: txid, mode: "insensitive" } },
              ],
            },
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { trackingNumber: { contains: search, mode: "insensitive" } },
            { shippingAddress: { fullName: { contains: search, mode: "insensitive" } } },
            { billingAddress: { fullName: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(channel ? { originSource: channel } : {}),
  };

  type ListOrder = Prisma.OrderGetPayload<{
    include: {
      user: { select: { name: true; email: true } };
      shippingAddress: true;
      billingAddress: true;
      payments: { select: { method: true; provider: true; asset: true } };
      lines: { select: { quantity: true } };
    };
  }>;

  const data = await prismaDevOr(
    "admin.orders.list",
    () =>
      Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: PAGE_SIZE,
          skip: (page - 1) * PAGE_SIZE,
          include: {
            user: { select: { name: true, email: true } },
            shippingAddress: true,
            billingAddress: true,
            payments: { select: { method: true, provider: true, asset: true } },
            lines: { select: { quantity: true } },
          },
        }),
        prisma.order.count(),
        Promise.all(
          statusOrder.map((s) =>
            prisma.order.count({ where: { status: s } }).then((c) => [s, c] as const),
          ),
        ),
      ]),
    [
      0,
      [] as ListOrder[],
      0,
      statusOrder.map((s) => [s, 0] as const),
    ] as [number, ListOrder[], number, ReadonlyArray<readonly [OrderStatus, number]>],
  );

  const [totalFiltered, orders, totalAll, statusCountsTuples] = data;
  const statusCounts = Object.fromEntries(statusCountsTuples) as Record<OrderStatus, number>;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  function buildHref(over: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    const merge = {
      status: activeStatus || undefined,
      s: search || undefined,
      customer: customer || undefined,
      txid: txid || undefined,
      channel: channel || undefined,
      from: from || undefined,
      to: to || undefined,
      page: String(page),
      ...over,
    };
    for (const [k, val] of Object.entries(merge)) {
      if (val) sp.set(k, String(val));
    }
    const q = sp.toString();
    return q ? `/admin/orders?${q}` : "/admin/orders";
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-xl border border-[#dcdcde] bg-white px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1d2327]">Orders</h1>
            <button className="rounded-md border border-[#dcdcde] bg-white px-2.5 py-1 text-xs font-medium text-[#2271b1] hover:bg-[#f6f7f7]">
              Add new order
            </button>
            <button className="rounded-md border border-[#dcdcde] bg-white px-2.5 py-1 text-xs font-medium text-[#2271b1] hover:bg-[#f6f7f7]">
              Import tracking number
            </button>
            <button className="rounded-md border border-[#dcdcde] bg-white px-2.5 py-1 text-xs font-medium text-[#2271b1] hover:bg-[#f6f7f7]">
              Export tracking number
            </button>
          </div>
          <form action="/admin/orders" className="flex w-full gap-1 sm:w-auto">
            <input
              type="search"
              name="s"
              defaultValue={search}
              placeholder="Search orders"
              className="h-8 w-full rounded-md border border-[#8c8f94] bg-white px-2 text-sm sm:w-64"
              aria-label="Search orders"
            />
            <button className="h-8 shrink-0 rounded-md border border-[#dcdcde] bg-white px-3 text-xs font-medium text-[#2271b1] hover:bg-[#f6f7f7]">
              Search orders
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#50575e]">
          <Link
            href={buildHref({ status: "", page: "1" })}
            className={!activeStatus ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:underline"}
          >
            All <span className="text-[#8c8f94]">({totalAll})</span>
          </Link>
          {statusOrder.map((s) => (
            <span key={s} className="contents">
              <span className="text-[#dcdcde]" aria-hidden>
                |
              </span>
              <Link
                href={buildHref({ status: s, page: "1" })}
                className={
                  activeStatus === s ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:underline"
                }
              >
                {statusMeta[s].label} <span className="text-[#8c8f94]">({statusCounts[s] ?? 0})</span>
              </Link>
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <form
        action="/admin/orders"
        className="rounded-xl border border-[#dcdcde] bg-white px-5 py-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]"
      >
        {activeStatus ? <input type="hidden" name="status" value={activeStatus} /> : null}
        {search ? <input type="hidden" name="s" value={search} /> : null}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
            aria-label="Bulk actions"
            defaultValue=""
          >
            <option value="">Bulk actions</option>
            <option value="status:processing">Mark Processing</option>
            <option value="status:completed">Mark Completed</option>
            <option value="status:cancelled">Mark Cancelled</option>
          </select>
          <button
            type="button"
            className="h-8 rounded-md border border-[#dcdcde] bg-white px-3 text-xs font-medium text-[#2271b1] hover:bg-[#f6f7f7]"
          >
            Apply
          </button>

          <input
            type="date"
            name="from"
            defaultValue={from ?? ""}
            className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
            aria-label="From date"
          />
          <input
            type="date"
            name="to"
            defaultValue={to ?? ""}
            className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
            aria-label="To date"
          />

          <select
            name="channel"
            defaultValue={channel ?? ""}
            className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
            aria-label="Sales channel"
          >
            <option value="">All sales channels</option>
            <option value="Direct">Direct</option>
            <option value="Organic">Organic</option>
            <option value="Referral">Referral</option>
            <option value="Paid">Paid</option>
          </select>

          <input
            type="text"
            name="customer"
            defaultValue={customer}
            placeholder="Filter by registered customer"
            className="h-8 w-48 rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
            aria-label="Filter by registered customer"
          />

          <input
            type="text"
            name="txid"
            defaultValue={txid}
            placeholder="Filter by crypto address/txid"
            className="h-8 w-52 rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
            aria-label="Filter by crypto address or txid"
          />

          <button className="h-8 rounded-md border border-[#dcdcde] bg-white px-3 font-medium text-[#2271b1] hover:bg-[#f6f7f7]">
            Filter
          </button>
          <p className="ml-auto text-xs text-[#50575e]">
            {totalFiltered} item{totalFiltered === 1 ? "" : "s"}
          </p>
        </div>
      </form>

      {/* Orders table */}
      <div className="overflow-hidden rounded-xl border border-[#dcdcde] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#dcdcde] bg-[#f6f7f7] text-[11px] uppercase tracking-wider text-[#50575e]">
                <th className="w-10 px-3 py-2.5 font-medium">
                  <input type="checkbox" aria-label="Select all orders" />
                </th>
                <th className="px-3 py-2.5 font-medium">Order</th>
                <th className="px-3 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Billing</th>
                <th className="px-3 py-2.5 font-medium">Ship to</th>
                <th className="px-3 py-2.5 text-right font-medium">Total</th>
                <th className="px-3 py-2.5 font-medium">Actions</th>
                <th className="px-3 py-2.5 font-medium">Tracking Number</th>
                <th className="px-3 py-2.5 font-medium">Origin</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((o, idx) => {
                  const meta = statusMeta[o.status];
                  const itemCount = o.lines.reduce((s, l) => s + l.quantity, 0);
                  const customerLabel = o.user?.name ?? o.shippingAddress?.fullName ?? o.user?.email ?? "Guest";
                  const payment = o.payments[0];
                  const payVia = payment
                    ? `via ${payment.method === "CRYPTO" ? `Pay in ${payment.asset ?? "Crypto"}` : "Card on-ramp"}`
                    : null;
                  return (
                    <tr
                      key={o.id}
                      className={`border-b border-[#f0f0f1] align-top transition-colors hover:bg-[#f9fafa] ${
                        idx % 2 === 0 ? "bg-white" : "bg-[#fbfbfc]"
                      }`}
                    >
                      <td className="px-3 py-3">
                        <input type="checkbox" aria-label={`Select ${o.orderNumber}`} />
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-semibold text-[#2271b1] hover:underline"
                        >
                          #{o.orderNumber} {customerLabel}
                        </Link>
                        <p className="mt-0.5 text-[11px] text-[#50575e]">{itemCount} item{itemCount === 1 ? "" : "s"}</p>
                      </td>
                      <td className="px-3 py-3 text-[#50575e]">{formatDate(o.createdAt)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-block max-w-[120px] truncate rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.pill}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[#1d2327]">
                        {o.billingAddress ? (
                          <>
                            <p>
                              {o.billingAddress.fullName}, {o.billingAddress.line1}
                              {o.billingAddress.line2 ? `, ${o.billingAddress.line2}` : ""}
                            </p>
                            <p className="text-[#50575e]">
                              {o.billingAddress.city}, {o.billingAddress.state} {o.billingAddress.postal}
                            </p>
                            <p className="text-[#50575e]">{o.billingAddress.country}</p>
                          </>
                        ) : (
                          <span className="text-[#787c82]">—</span>
                        )}
                        {payVia ? <p className="mt-1 text-[11px] text-[#646970]">{payVia}</p> : null}
                      </td>
                      <td className="px-3 py-3 text-[#1d2327]">
                        {o.shippingAddress ? (
                          <>
                            <p className="text-[#2271b1] hover:underline">
                              {o.shippingAddress.fullName}, {o.shippingAddress.line1}
                              {o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""}
                            </p>
                            <p className="text-[#50575e]">
                              {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postal}
                            </p>
                            <p className="text-[#50575e]">{o.shippingAddress.country}</p>
                          </>
                        ) : (
                          <span className="text-[#787c82]">—</span>
                        )}
                        {o.shippingMethod ? (
                          <p className="mt-1 text-[11px] text-[#646970]">via {o.shippingMethod}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-[#1d2327]">
                        {formatUsd(o.totalCents)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#dcdcde] bg-white text-[#2271b1] hover:bg-[#f6f7f7]"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          {o.user?.email ? (
                            <a
                              href={`mailto:${o.user.email}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#dcdcde] bg-white text-[#2271b1] hover:bg-[#f6f7f7]"
                              title="Email customer"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#dcdcde] bg-white text-[#50575e] hover:bg-[#f6f7f7]"
                            title="More"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[#50575e]">
                        {o.trackingNumber ? (
                          <p className="font-medium text-[#1d2327]">{o.trackingNumber}</p>
                        ) : (
                          <span className="text-[#787c82]">—</span>
                        )}
                        {o.trackingCarrier ? (
                          <p className="text-[11px] text-[#646970]">{o.trackingCarrier}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-[#50575e]">
                        <p>{o.originSource ?? "Direct"}</p>
                        {o.originReferrer ? (
                          <p className="text-[11px] text-[#646970]">{o.originReferrer}</p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-sm text-[#50575e]">
                    No orders match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#dcdcde] px-4 py-2 text-xs text-[#50575e]">
          <p>
            {totalFiltered === 0
              ? "0 items"
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalFiltered)} of ${totalFiltered}`}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={buildHref({ page: String(Math.max(1, page - 1)) })}
              aria-label="Previous page"
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#dcdcde] bg-white ${
                page <= 1 ? "pointer-events-none opacity-50" : "text-[#2271b1] hover:bg-[#f6f7f7]"
              }`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
            <span>
              Page <strong className="text-[#1d2327]">{page}</strong> of {totalPages}
            </span>
            <Link
              href={buildHref({ page: String(Math.min(totalPages, page + 1)) })}
              aria-label="Next page"
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#dcdcde] bg-white ${
                page >= totalPages ? "pointer-events-none opacity-50" : "text-[#2271b1] hover:bg-[#f6f7f7]"
              }`}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
