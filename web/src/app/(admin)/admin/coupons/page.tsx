import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/domain/money";
import { Prisma } from "@prisma/client";
import { bulkDeleteCouponsAction, deleteCouponAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(params: Awaited<SearchParams>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

const PAGE_SIZE = 25;

function noticeText(notice: string | undefined) {
  switch (notice) {
    case "coupon_deleted":
      return "Coupon deleted.";
    case "coupon_in_use":
      return "That coupon is linked to orders and cannot be deleted. Deactivate it instead.";
    case "bulk_deleted":
      return "Selected coupons were deleted.";
    case "bulk_partial":
      return "Some coupons were deleted; others are in use and were skipped.";
    case "bulk_all_in_use":
      return "None of the selected coupons could be deleted (all are in use).";
    case "bulk_none":
      return "Select at least one coupon.";
    default:
      return null;
  }
}

export default async function AdminCouponsPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const query = getParam(params, "s")?.trim();
  const type = getParam(params, "type")?.trim();
  const pageRaw = getParam(params, "page");
  const page = Math.max(1, Math.floor(Number(pageRaw) || 1));
  const notice = getParam(params, "notice") ?? undefined;

  const where: Prisma.CouponWhereInput = {
    ...(query
      ? {
          OR: [
            { code: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(type === "PERCENT" || type === "FIXED" ? { type } : {}),
  };

  const [totalFiltered, totalAll, rows] = await Promise.all([
    prisma.coupon.count({ where }),
    prisma.coupon.count(),
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const noticeMsg = noticeText(notice);

  const qForExport = new URLSearchParams();
  if (query) qForExport.set("s", query);
  if (type === "PERCENT" || type === "FIXED") qForExport.set("type", type);
  const exportHref = `/admin/coupons/export${qForExport.toString() ? `?${qForExport}` : ""}`;

  function pageHref(p: number) {
    const q = new URLSearchParams();
    if (query) q.set("s", query);
    if (type === "PERCENT" || type === "FIXED") q.set("type", type);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `/admin/coupons?${qs}` : "/admin/coupons";
  }

  return (
    <div className="space-y-4">
      {noticeMsg ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice === "coupon_in_use" || notice === "bulk_all_in_use"
              ? "border-amber-200 bg-amber-50 text-amber-950"
              : "border-green-200 bg-green-50 text-green-900"
          }`}
          role="status"
        >
          {noticeMsg}
        </div>
      ) : null}

      <div className="rounded-xl border border-[#dcdcde] bg-white px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1d2327]">Coupons</h1>
            <Link
              href="/admin/coupons/new"
              className="rounded-md bg-[#2271b1] px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-[#135e96]"
            >
              Add new coupon
            </Link>
            <Link
              href={exportHref}
              className="rounded-md border border-[#dcdcde] bg-white px-2.5 py-1 text-xs font-medium text-[#2271b1] hover:bg-[#f6f7f7]"
            >
              Export to CSV
            </Link>
          </div>
          <form action="/admin/coupons" className="flex w-full gap-1 sm:w-auto">
            {type === "PERCENT" || type === "FIXED" ? <input type="hidden" name="type" value={type} /> : null}
            <input
              type="search"
              name="s"
              defaultValue={query}
              placeholder="Search coupons"
              className="h-8 w-full rounded-md border border-[#8c8f94] bg-white px-2 text-sm sm:w-64"
              aria-label="Search coupons"
            />
            <button className="h-8 shrink-0 rounded-md border border-[#dcdcde] bg-white px-3 text-xs font-medium text-[#2271b1] hover:bg-[#f6f7f7]">
              Search
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#50575e]">
          <Link
            href="/admin/coupons"
            className={!type ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:underline"}
          >
            All <span className="text-[#8c8f94]">({totalAll})</span>
          </Link>
          <span className="text-[#dcdcde]" aria-hidden>
            |
          </span>
          <Link
            href="/admin/coupons?type=PERCENT"
            className={type === "PERCENT" ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:underline"}
          >
            Percentage
          </Link>
          <span className="text-[#dcdcde]" aria-hidden>
            |
          </span>
          <Link
            href="/admin/coupons?type=FIXED"
            className={type === "FIXED" ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:underline"}
          >
            Fixed cart
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-[#dcdcde] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <form
          id="bulk-coupon-form"
          action={bulkDeleteCouponsAction}
          className="flex flex-wrap items-center gap-2 border-b border-[#dcdcde] px-5 py-3 text-xs"
        >
          <span className="text-[#50575e]">Bulk:</span>
          <Button type="submit" size="sm" variant="destructive" className="h-8 text-xs">
            Delete selected
          </Button>
          {query ? <input type="hidden" name="s" value={query} /> : null}
        </form>

        <div className="overflow-x-auto px-5 pt-3">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#dcdcde] text-xs uppercase tracking-wide text-[#787c82]">
                <th className="w-10 py-2 pr-2">
                  <span className="sr-only">Select</span>
                </th>
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Description</th>
                <th className="py-2 pr-3">Usage / limit</th>
                <th className="py-2 pr-3">Expiry</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7]">
                  <td className="py-2 pr-2 align-top">
                    <input
                      type="checkbox"
                      name="couponIds"
                      value={c.id}
                      form="bulk-coupon-form"
                      className="h-4 w-4"
                      aria-label={`Select ${c.code}`}
                    />
                  </td>
                  <td className="py-2 pr-3 align-top font-medium">
                    <Link href={`/admin/coupons/${c.id}`} className="text-[#2271b1] hover:underline">
                      {c.code}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 align-top text-[#50575e]">
                    {c.type === "PERCENT" ? "Percentage" : "Fixed cart"}
                  </td>
                  <td className="py-2 pr-3 align-top tabular-nums">
                    {c.type === "PERCENT" ? `${c.value}%` : formatUsd(c.value)}
                  </td>
                  <td className="max-w-[200px] truncate py-2 pr-3 align-top text-[#50575e]">{c.description ?? "—"}</td>
                  <td className="py-2 pr-3 align-top tabular-nums text-[#50575e]">
                    {c.redemptionCount} / {c.maxRedemptions ?? "∞"}
                  </td>
                  <td className="py-2 pr-3 align-top text-[#50575e]">
                    {c.endsAt
                      ? c.endsAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : "—"}
                  </td>
                  <td className="py-2 pr-3 align-top">{c.active ? "Yes" : "No"}</td>
                  <td className="py-2 align-top">
                    <form action={deleteCouponAction} className="inline">
                      <input type="hidden" name="id" value={c.id} />
                      <Button type="submit" size="sm" variant="outline" className="h-7 text-xs">
                        Delete
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#dcdcde] px-5 py-3 text-xs text-[#50575e]">
          <span>
            {totalFiltered} item{totalFiltered === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={pageHref(page - 1)}
              className={`rounded border border-[#dcdcde] px-2 py-1 ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
              aria-disabled={page <= 1}
            >
              Prev
            </Link>
            <span className="tabular-nums">
              Page {page} of {totalPages}
            </span>
            <Link
              href={pageHref(page + 1)}
              className={`rounded border border-[#dcdcde] px-2 py-1 ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
              aria-disabled={page >= totalPages}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
