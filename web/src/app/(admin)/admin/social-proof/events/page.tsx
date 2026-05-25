import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { requireStaff } from "@/lib/auth/admin";
import { loadSocialProofStore, pickActiveStreamNotification, isSocialProofGloballyEnabled } from "@/lib/social-proof/config";
import { resolveSocialProofActivity } from "@/lib/social-proof/resolve";
import { fetchSocialProofEventsFeed, fetchSocialProofEventsSummary } from "@/lib/social-proof/events-feed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SocialProofSubNav } from "../social-proof-subnav";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseIntParam(raw: string | string[] | undefined, fallback: number): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(s);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

export default async function AdminSocialProofEventsPage({ searchParams }: { searchParams?: SearchParams }) {
  await requireStaff();
  const params = searchParams ? await searchParams : {};
  const windowDays = Math.min(30, Math.max(1, parseIntParam(params.days, 7)));
  const page = Math.max(1, parseIntParam(params.page, 1));
  const search = typeof params.q === "string" ? params.q : params.q?.[0] ?? "";

  const store = await loadSocialProofStore();
  const enabled = isSocialProofGloballyEnabled(store.global);
  const activeStream = pickActiveStreamNotification(store);

  const [{ events, total, pageSize }, summary] = await Promise.all([
    fetchSocialProofEventsFeed({ windowDays, page, pageSize: 25, search }),
    fetchSocialProofEventsSummary(windowDays),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  let dataSource: "real" | "demo" | "synthetic" | "none" = "none";
  if (enabled && activeStream) {
    const resolved = await resolveSocialProofActivity({
      windowDays: activeStream.config.windowDays,
      take: 5,
      maxAgeHours: activeStream.config.maxAgeHours,
      fallbackMode: store.global.fallbackMode,
      demoItems: store.global.demoItems,
      showLocation: activeStream.config.showLocation,
      includeComboAggregate: false,
    });
    dataSource = resolved.source;
  }

  const qs = (next: Record<string, string | number>) => {
    const p = new URLSearchParams();
    p.set("days", String(windowDays));
    if (search) p.set("q", search);
    for (const [k, v] of Object.entries(next)) p.set(k, String(v));
    return `/admin/social-proof/events?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1d2327]">Social Proof</h1>
        <p className="mt-1 text-sm text-[#50575e]">
          Captured order events that power Stream and Combo notifications. Staff-only — emails never appear on the
          storefront.
        </p>
      </div>

      <SocialProofSubNav />

      {store.global.debugMode ? (
        <div className="rounded-md border border-[#b8daff] bg-[#e7f3ff] px-4 py-3 text-sm text-[#004085]">
          <strong>Debug mode is on.</strong> Storefront widget logs rotation, path matching, and beacon events to the
          browser console.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#dcdcde] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#50575e]">Completed orders</p>
          <p className="mt-1 text-2xl font-bold text-[#1d2327]">{summary.completedOrders}</p>
          <p className="mt-1 text-xs text-[#50575e]">Last {windowDays} days</p>
        </div>
        <div className="rounded-lg border border-[#dcdcde] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#50575e]">Unique customers</p>
          <p className="mt-1 text-2xl font-bold text-[#1d2327]">{summary.uniqueCustomers}</p>
          <p className="mt-1 text-xs text-[#50575e]">Last {windowDays} days</p>
        </div>
        <div className="rounded-lg border border-[#dcdcde] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#50575e]">Storefront data source</p>
          <p className="mt-1 text-2xl font-bold capitalize text-[#1d2327]">{enabled ? dataSource : "off"}</p>
          <p className="mt-1 text-xs text-[#50575e]">
            {dataSource === "synthetic" ? "Synthetic fallback active" : "What shoppers see today"}
          </p>
        </div>
      </div>

      <section className="rounded-lg border border-[#dcdcde] bg-white">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#dcdcde] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1d2327]">Events feed</h2>
            <p className="text-sm text-[#50575e]">{total} order{total === 1 ? "" : "s"} captured</p>
          </div>
          <form method="get" className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label htmlFor="days" className="text-xs font-medium text-[#50575e]">
                Window
              </label>
              <select
                id="days"
                name="days"
                defaultValue={String(windowDays)}
                className="h-9 rounded-md border border-[#dcdcde] bg-white px-2 text-sm"
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="q" className="text-xs font-medium text-[#50575e]">
                Search
              </label>
              <Input id="q" name="q" defaultValue={search} placeholder="Order, email, product…" className="h-9 w-48" />
            </div>
            <Button type="submit" size="sm" className="h-9">
              Filter
            </Button>
          </form>
        </div>

        {events.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[#50575e]">
            No completed orders in this window.
            {enabled && dataSource === "synthetic" ? (
              <p className="mt-2">
                Storefront is using <strong>synthetic fallback</strong> until real orders arrive.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-[#f6f7f7] text-[#50575e]">
                <tr>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Location</th>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium">Order</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  let whenLabel = ev.completedAtIso;
                  try {
                    whenLabel = formatDistanceToNow(new Date(ev.completedAtIso), { addSuffix: true });
                  } catch {
                    /* keep iso */
                  }
                  return (
                    <tr key={ev.id} className="border-t border-[#dcdcde]">
                      <td className="whitespace-nowrap px-4 py-3 text-[#50575e]" title={ev.completedAtIso}>
                        {whenLabel}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-[#e7f3ff] px-2 py-0.5 text-xs font-medium text-[#004085]">
                          {ev.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1d2327]">{ev.displayName}</p>
                        {ev.email ? <p className="text-xs text-[#50575e]">{ev.email}</p> : null}
                      </td>
                      <td className="px-4 py-3 text-[#50575e]">{ev.locationLine ?? "—"}</td>
                      <td className="px-4 py-3 text-[#50575e]">
                        {ev.productSlug ? (
                          <Link href={`/product/${ev.productSlug}`} className="text-[#2271b1] hover:underline">
                            {ev.productName ?? ev.productSlug}
                          </Link>
                        ) : (
                          (ev.productName ?? "—")
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${ev.id}`} className="font-medium text-[#2271b1] hover:underline">
                          {ev.orderNumber}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-[#dcdcde] px-5 py-3 text-sm">
            <span className="text-[#50575e]">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={qs({ page: page - 1 })}>Previous</Link>
                </Button>
              ) : null}
              {page < totalPages ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={qs({ page: page + 1 })}>Next</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <p className="text-xs text-[#50575e]">
        Privacy: the storefront shows first name and city/state only. This feed includes email for staff verification
        and is never exposed via public APIs.
      </p>
    </div>
  );
}
