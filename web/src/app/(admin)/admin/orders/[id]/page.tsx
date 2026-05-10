import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Banknote,
  Globe,
  Laptop,
  MapPin,
  Package,
  Phone,
  Receipt,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";
import { formatUsd } from "@/lib/domain/money";
import { updateOrderAction } from "@/lib/actions/admin";

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: OrderStatus.PENDING_PAYMENT, label: "Pending payment" },
  { value: OrderStatus.PROCESSING, label: "Processing" },
  { value: OrderStatus.ON_HOLD, label: "On hold" },
  { value: OrderStatus.COMPLETED, label: "Completed" },
  { value: OrderStatus.CANCELLED, label: "Cancelled" },
  { value: OrderStatus.REFUNDED, label: "Refunded" },
  { value: OrderStatus.FAILED, label: "Failed" },
  { value: OrderStatus.DRAFT, label: "Draft" },
];

function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatTimeInput(d: Date) {
  return d.toISOString().slice(11, 16);
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prismaDevOr(
    "admin.orders.detail",
    () =>
      prisma.order.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          shippingAddress: true,
          billingAddress: true,
          coupon: true,
          payments: {
            orderBy: { createdAt: "desc" },
            include: { events: { orderBy: { createdAt: "desc" }, take: 5 } },
          },
          lines: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: { orderBy: { sortOrder: "asc" }, take: 1 },
                },
              },
            },
          },
        },
      }),
    null,
  );

  if (!order) notFound();

  const subtotalCents = order.lines.reduce((s, l) => s + l.lineTotalCents, 0);
  const payment = order.payments[0];
  const payVia = payment
    ? payment.method === "CRYPTO"
      ? `Pay in ${payment.asset ?? "Crypto"}`
      : "Card on-ramp"
    : null;

  return (
    <div className="space-y-4">
      {/* Top header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="text-xs font-medium text-[#2271b1] hover:underline">
            ← Orders
          </Link>
          <h1 className="text-xl font-semibold text-[#1d2327]">Edit Order</h1>
        </div>
      </div>

      <form action={updateOrderAction}>
        <input type="hidden" name="id" value={order.id} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main column */}
          <div className="space-y-4">
            {/* Header card: order number, payment via, customer IP */}
            <div className="rounded-xl border border-[#dcdcde] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#f0f0f1] pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1d2327]">Order #{order.orderNumber} details</h2>
                  <p className="mt-1 text-xs text-[#50575e]">
                    {payVia ? `Payment via ${payVia}. ` : ""}Customer IP: {order.customerIp ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-[#50575e]">Order total</p>
                  <p className="text-2xl font-semibold text-[#1d2327]">{formatUsd(order.totalCents)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-6 sm:grid-cols-3">
                {/* General */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#50575e]">General</p>
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 text-xs text-[#50575e]">
                      <span>Date created:</span>
                      <input
                        type="date"
                        name="dateCreated"
                        defaultValue={formatDateInput(order.createdAt)}
                        className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-sm text-[#1d2327]"
                        readOnly
                      />
                      <input
                        type="time"
                        name="timeCreated"
                        defaultValue={formatTimeInput(order.createdAt)}
                        className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-sm text-[#1d2327]"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#50575e]" htmlFor="status">
                        Status:
                      </label>
                      <select
                        id="status"
                        name="status"
                        defaultValue={order.status}
                        className="mt-1 h-8 w-full rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
                      >
                        {statusOptions.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <p className="text-xs text-[#50575e]">Customer:</p>
                      <div className="mt-1 flex h-8 items-center gap-2 rounded-md border border-[#8c8f94] bg-white px-2 text-sm text-[#1d2327]">
                        <UserIcon className="h-3.5 w-3.5 text-[#50575e]" />
                        <span className="truncate">
                          {order.user?.name ?? order.user?.email ?? "Guest"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#50575e]">Billing</p>
                  <div className="mt-3 space-y-1.5 text-sm text-[#1d2327]">
                    {order.billingAddress ? (
                      <>
                        <p className="font-medium">{order.billingAddress.fullName}</p>
                        <p className="text-[#3c434a]">{order.billingAddress.line1}</p>
                        {order.billingAddress.line2 ? (
                          <p className="text-[#3c434a]">{order.billingAddress.line2}</p>
                        ) : null}
                        <p className="text-[#3c434a]">
                          {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postal}
                        </p>
                        <p className="text-[#3c434a]">{order.billingAddress.country}</p>
                        {order.user?.email ? (
                          <p className="mt-3 inline-flex items-center gap-1.5 text-[#2271b1] hover:underline">
                            <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
                          </p>
                        ) : null}
                        {order.billingAddress.phone ? (
                          <p className="inline-flex items-center gap-1.5 text-[#2271b1]">
                            <Phone className="h-3 w-3" />
                            {order.billingAddress.phone}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-[#787c82]">No billing address</p>
                    )}
                  </div>
                </div>

                {/* Shipping */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#50575e]">Shipping</p>
                  <div className="mt-3 space-y-1.5 text-sm text-[#1d2327]">
                    {order.shippingAddress ? (
                      <>
                        <p className="font-medium">{order.shippingAddress.fullName}</p>
                        <p className="text-[#3c434a]">{order.shippingAddress.line1}</p>
                        {order.shippingAddress.line2 ? (
                          <p className="text-[#3c434a]">{order.shippingAddress.line2}</p>
                        ) : null}
                        <p className="text-[#3c434a]">
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal}
                        </p>
                        <p className="text-[#3c434a]">{order.shippingAddress.country}</p>
                      </>
                    ) : (
                      <p className="text-[#787c82]">No shipping address</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="overflow-hidden rounded-xl border border-[#dcdcde] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#dcdcde] bg-[#f6f7f7] text-[11px] uppercase tracking-wider text-[#50575e]">
                    <th className="px-4 py-2.5 font-medium">Item</th>
                    <th className="px-4 py-2.5 text-right font-medium">Price</th>
                    <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((l) => {
                    const img = l.product?.images?.[0];
                    return (
                      <tr key={l.id} className="border-b border-[#f0f0f1] align-top">
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element -- admin lists may show remote product URLs.
                              <img
                                src={img.url}
                                alt={img.alt || l.title}
                                className="h-12 w-12 rounded-md border border-[#dcdcde] object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#dcdcde] bg-[#f6f7f7]">
                                <Package className="h-4 w-4 text-[#8c8f94]" />
                              </div>
                            )}
                            <div className="min-w-0">
                              {l.product ? (
                                <Link
                                  href={`/admin/products/${l.product.id}`}
                                  className="font-medium text-[#2271b1] hover:underline"
                                >
                                  {l.title}
                                </Link>
                              ) : (
                                <p className="font-medium text-[#1d2327]">{l.title}</p>
                              )}
                              <p className="mt-1 text-xs text-[#50575e]">
                                Variation ID: {l.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-[#1d2327]">{formatUsd(l.unitPriceCents)}</td>
                        <td className="px-4 py-3 text-right text-[#50575e]">× {l.quantity}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#1d2327]">
                          {formatUsd(l.lineTotalCents)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Shipping line */}
                  <tr className="border-b border-[#f0f0f1]">
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm font-medium text-[#1d2327]">{order.shippingMethod ?? "Shipping"}</p>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <input
                          type="text"
                          name="shippingMethod"
                          defaultValue={order.shippingMethod ?? ""}
                          placeholder="Shipping method (e.g. Express)"
                          className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-xs"
                        />
                        <input
                          type="text"
                          name="trackingCarrier"
                          defaultValue={order.trackingCarrier ?? ""}
                          placeholder="Carrier"
                          className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-xs"
                        />
                        <input
                          type="text"
                          name="trackingNumber"
                          defaultValue={order.trackingNumber ?? ""}
                          placeholder="Tracking number"
                          className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-xs"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-right text-[#1d2327]">{formatUsd(order.shippingCents)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-[#50575e]">
                      Items subtotal:
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-[#1d2327]">{formatUsd(subtotalCents)}</td>
                  </tr>
                  {order.discountCents > 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-sm text-[#50575e]">
                        Discount{order.coupon ? ` (${order.coupon.code})` : ""}:
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-[#1d2327]">
                        −{formatUsd(order.discountCents)}
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-[#50575e]">
                      Shipping:
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-[#1d2327]">{formatUsd(order.shippingCents)}</td>
                  </tr>
                  {order.taxCents > 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-sm text-[#50575e]">
                        Tax:
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-[#1d2327]">{formatUsd(order.taxCents)}</td>
                    </tr>
                  ) : null}
                  <tr className="border-t border-[#dcdcde] bg-[#f6f7f7]">
                    <td colSpan={3} className="px-4 py-2 text-right text-sm font-semibold text-[#1d2327]">
                      Order total:
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold text-[#1d2327]">
                      {formatUsd(order.totalCents)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <SidebarPanel title="Order attribution">
              <ul className="space-y-2 text-xs text-[#50575e]">
                <li className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Origin</span>
                  <span className="ml-auto font-medium text-[#1d2327]">{order.originSource ?? "—"}</span>
                </li>
                {order.originReferrer ? (
                  <li className="flex items-center gap-2">
                    <span className="ml-5">Referrer</span>
                    <span className="ml-auto font-medium text-[#1d2327]">{order.originReferrer}</span>
                  </li>
                ) : null}
                <li className="flex items-center gap-2">
                  <Laptop className="h-3.5 w-3.5" />
                  <span>Device type</span>
                  <span className="ml-auto font-medium text-[#1d2327]">{order.deviceType ?? "—"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Session views</span>
                  <span className="ml-auto font-medium text-[#1d2327]">{order.sessionPageViews ?? "—"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Customer IP</span>
                  <span className="ml-auto font-medium text-[#1d2327]">{order.customerIp ?? "—"}</span>
                </li>
              </ul>
            </SidebarPanel>

            <SidebarPanel title="Customer history">
              <p className="text-xs text-[#50575e]">
                {order.user?.email ? (
                  <Link
                    href={`/admin/orders?customer=${encodeURIComponent(order.user.email)}`}
                    className="text-[#2271b1] hover:underline"
                  >
                    View all orders by {order.user.name ?? order.user.email}
                  </Link>
                ) : (
                  "Guest checkout"
                )}
              </p>
            </SidebarPanel>

            <SidebarPanel title="Order notes">
              <textarea
                name="adminNote"
                defaultValue={order.adminNote ?? ""}
                placeholder="Add note"
                rows={4}
                className="w-full rounded-md border border-[#8c8f94] bg-white px-2 py-1.5 text-sm"
              />
              <p className="mt-2 text-[11px] text-[#50575e]">Private note · only visible to admin</p>
            </SidebarPanel>

            {payment ? (
              <SidebarPanel title="Payment">
                <ul className="space-y-1.5 text-xs text-[#50575e]">
                  <li className="flex items-center gap-2">
                    <Banknote className="h-3.5 w-3.5" />
                    <span>Provider</span>
                    <span className="ml-auto font-medium text-[#1d2327]">{payment.provider}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="ml-5">Status</span>
                    <span className="ml-auto font-medium text-[#1d2327]">{payment.status}</span>
                  </li>
                  {payment.externalId ? (
                    <li className="break-all">
                      <span className="font-medium text-[#1d2327]">Ref:</span> {payment.externalId}
                    </li>
                  ) : null}
                </ul>
              </SidebarPanel>
            ) : null}

            <div className="rounded-xl border border-[#dcdcde] bg-white p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#a82220] hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Move to Trash
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#2271b1] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#135e96]"
                >
                  Update
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[#dcdcde] bg-white p-3 text-[11px] text-[#50575e] shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              Last updated {formatDateTime(order.updatedAt)}
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}

function SidebarPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#dcdcde] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#50575e]">{title}</p>
      {children}
    </div>
  );
}
