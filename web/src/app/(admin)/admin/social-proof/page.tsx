import Link from "next/link";
import { requireStaff } from "@/lib/auth/admin";
import {
  createDefaultSocialProofNotificationAction,
  deleteSocialProofNotificationAction,
  resetSocialProofAnalyticsAction,
  toggleSocialProofNotificationAction,
  updateSocialProofGlobalAction,
} from "@/lib/actions/social-proof";
import {
  isSocialProofGloballyEnabled,
  loadSocialProofStore,
  pickActiveStreamNotification,
} from "@/lib/social-proof/config";
import { loadSocialProofAnalyticsStore, getNotificationAnalytics } from "@/lib/social-proof/analytics-store";
import {
  formatClickThroughRate,
  formatRelativeHours,
  notificationNotShownRecently,
} from "@/lib/social-proof/diagnostics";
import { fetchSocialProofEventsSummary } from "@/lib/social-proof/events-feed";
import { resolveSocialProofActivity } from "@/lib/social-proof/resolve";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialProofSubNav } from "./social-proof-subnav";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function noticeText(notice: string | undefined) {
  switch (notice) {
    case "global_saved":
      return "Global settings saved.";
    case "saved":
      return "Notification saved.";
    case "deleted":
      return "Notification deleted.";
    case "toggled":
      return "Notification status updated.";
    case "created_default":
      return "Default notification created.";
    case "analytics_reset":
      return "Analytics counters reset.";
    case "name_required":
      return "Notification name is required.";
    case "not_found":
      return "Notification not found.";
    default:
      return null;
  }
}

export default async function AdminSocialProofPage({ searchParams }: { searchParams?: SearchParams }) {
  await requireStaff();
  const params = searchParams ? await searchParams : {};
  const notice = typeof params.notice === "string" ? params.notice : params.notice?.[0];
  const noticeMsg = noticeText(notice);

  const [store, analyticsStore, eventsSummary] = await Promise.all([
    loadSocialProofStore(),
    loadSocialProofAnalyticsStore(),
    fetchSocialProofEventsSummary(7),
  ]);

  const enabled = isSocialProofGloballyEnabled(store.global);
  const activeStream = pickActiveStreamNotification(store);

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

  const totalImpressions = store.notifications.reduce(
    (sum, n) => sum + getNotificationAnalytics(analyticsStore, n.id).impressions,
    0,
  );
  const totalClicks = store.notifications.reduce(
    (sum, n) => sum + getNotificationAnalytics(analyticsStore, n.id).clicks,
    0,
  );
  const staleCount = store.notifications.filter((n) =>
    notificationNotShownRecently(n, getNotificationAnalytics(analyticsStore, n.id)),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Social Proof</h1>
          <p className="mt-1 text-sm text-[#50575e]">
            Manage storefront nudges powered by your order data, with synthetic fallback when activity is quiet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/social-proof/new">+ New notification</Link>
          </Button>
          {store.notifications.length === 0 ? (
            <form action={createDefaultSocialProofNotificationAction}>
              <Button type="submit" variant="outline">
                Quick start
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <SocialProofSubNav />

      {noticeMsg ? (
        <div className="rounded-md border border-[#c3e6cb] bg-[#d4edda] px-4 py-3 text-sm text-[#155724]">{noticeMsg}</div>
      ) : null}

      {store.global.debugMode ? (
        <div className="rounded-md border border-[#b8daff] bg-[#e7f3ff] px-4 py-3 text-sm text-[#004085]">
          <strong>Debug mode is on.</strong> Open the storefront and check the browser console for rotation, path
          matching, and beacon events.
        </div>
      ) : null}

      {enabled && staleCount > 0 ? (
        <div className="rounded-md border border-[#ffeeba] bg-[#fff3cd] px-4 py-3 text-sm text-[#856404]">
          {staleCount} active notification{staleCount === 1 ? "" : "s"} ha{staleCount === 1 ? "s" : "ve"} not been shown
          on the storefront in the last 24 hours. Check path rules, mobile settings, or whether the widget is enabled.
        </div>
      ) : null}

      {enabled && dataSource === "synthetic" ? (
        <div className="rounded-md border border-[#ffeeba] bg-[#fff3cd] px-4 py-3 text-sm text-[#856404]">
          No recent completed orders — storefront is using <strong>synthetic fallback</strong> (random names and
          activities). Real orders will replace these automatically.
        </div>
      ) : null}

      {enabled && dataSource === "real" ? (
        <div className="rounded-md border border-[#c3e6cb] bg-[#f0fff4] px-4 py-3 text-sm text-[#155724]">
          Live order activity detected — showing real social proof on the storefront.
        </div>
      ) : null}

      {!enabled ? (
        <div className="rounded-md border border-[#dcdcde] bg-white px-4 py-3 text-sm text-[#50575e]">
          Social proof is <strong>disabled</strong>. Enable below or set{" "}
          <code className="rounded bg-[#f0f0f1] px-1">NEXT_PUBLIC_SOCIAL_PROOF_ENABLED=1</code> (legacy).
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#dcdcde] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#50575e]">Impressions (7d feed)</p>
          <p className="mt-1 text-2xl font-bold text-[#1d2327]">{totalImpressions.toLocaleString()}</p>
          <p className="mt-1 text-xs text-[#50575e]">All notifications</p>
        </div>
        <div className="rounded-lg border border-[#dcdcde] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#50575e]">Clicks</p>
          <p className="mt-1 text-2xl font-bold text-[#1d2327]">{totalClicks.toLocaleString()}</p>
          <p className="mt-1 text-xs text-[#50575e]">
            CTR{" "}
            {totalImpressions > 0 ? `${Math.round((totalClicks / totalImpressions) * 1000) / 10}%` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-[#dcdcde] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#50575e]">Order events</p>
          <p className="mt-1 text-2xl font-bold text-[#1d2327]">{eventsSummary.completedOrders}</p>
          <p className="mt-1 text-xs text-[#50575e]">
            <Link href="/admin/social-proof/events" className="text-[#2271b1] hover:underline">
              View events feed →
            </Link>
          </p>
        </div>
        <div className="rounded-lg border border-[#dcdcde] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#50575e]">Data source</p>
          <p className="mt-1 text-2xl font-bold capitalize text-[#1d2327]">{enabled ? dataSource : "off"}</p>
          <p className="mt-1 text-xs text-[#50575e]">Storefront activity today</p>
        </div>
      </div>

      <section className="rounded-lg border border-[#dcdcde] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1d2327]">Global settings</h2>
        <form action={updateSocialProofGlobalAction} className="mt-4 grid max-w-xl gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="enabled" defaultChecked={store.global.enabled} />
            Enable social proof on storefront
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="brandLabel">Brand label in nudge footer</Label>
            <Input id="brandLabel" name="brandLabel" defaultValue={store.global.brandLabel} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fallbackMode">When no recent orders</Label>
            <select
              id="fallbackMode"
              name="fallbackMode"
              defaultValue={store.global.fallbackMode}
              className="h-10 w-full rounded-md border border-[#dcdcde] bg-white px-3 text-sm"
            >
              <option value="auto">Auto — synthetic names & activities (recommended)</option>
              <option value="demo_only">Demo only — hide if no curated demo data</option>
              <option value="off">Off — hide widget when empty</option>
            </select>
            <p className="text-xs text-[#50575e]">
              Purchase notifications only name products that are published in your Modempic catalog.
              Synthetic fallback pulls random published products; demo or env data with unknown products
              is shown without a product name.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="debugMode" defaultChecked={store.global.debugMode} />
            Debug mode (console logs + beacon tracing on storefront)
          </label>
          <Button type="submit" className="w-fit">
            Save global settings
          </Button>
        </form>
        <form action={resetSocialProofAnalyticsAction} className="mt-3">
          <Button type="submit" variant="outline" size="sm">
            Reset analytics counters
          </Button>
        </form>
      </section>

      <section className="rounded-lg border border-[#dcdcde] bg-white">
        <div className="border-b border-[#dcdcde] px-5 py-3">
          <h2 className="text-lg font-semibold text-[#1d2327]">Notifications</h2>
        </div>
        {store.notifications.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[#50575e]">
            No notifications yet. Create one or use Quick start to add a default Stream notification.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-[#f6f7f7] text-[#50575e]">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Stats</th>
                  <th className="px-4 py-2 font-medium">Last shown</th>
                  <th className="px-4 py-2 font-medium">Priority</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {store.notifications.map((n) => {
                  const stats = getNotificationAnalytics(analyticsStore, n.id);
                  const stale = notificationNotShownRecently(n, stats);
                  return (
                    <tr key={n.id} className="border-t border-[#dcdcde]">
                      <td className="px-4 py-3 font-medium text-[#1d2327]">
                        <Link href={`/admin/social-proof/${n.id}`} className="text-[#2271b1] hover:underline">
                          {n.name}
                        </Link>
                        {stale ? (
                          <span className="ml-2 inline-flex rounded-full bg-[#fff3cd] px-2 py-0.5 text-[10px] font-medium text-[#856404]">
                            Not shown 24h+
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 capitalize text-[#50575e]">{n.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            n.status === "active"
                              ? "bg-[#d4edda] text-[#155724]"
                              : n.status === "paused"
                                ? "bg-[#f0f0f1] text-[#50575e]"
                                : "bg-[#fff3cd] text-[#856404]"
                          }`}
                        >
                          {n.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#50575e]">
                        <span title="Impressions">{stats.impressions.toLocaleString()} views</span>
                        <span className="mx-1 text-[#c3c4c7]">·</span>
                        <span title="Click-through rate">{formatClickThroughRate(stats)} CTR</span>
                      </td>
                      <td className="px-4 py-3 text-[#50575e]">{formatRelativeHours(stats.lastShownAt)}</td>
                      <td className="px-4 py-3 text-[#50575e]">{n.priority}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/social-proof/${n.id}`}>Edit</Link>
                          </Button>
                          <form action={toggleSocialProofNotificationAction}>
                            <input type="hidden" name="id" value={n.id} />
                            <Button size="sm" variant="outline" type="submit">
                              {n.status === "active" ? "Pause" : "Activate"}
                            </Button>
                          </form>
                          <form action={deleteSocialProofNotificationAction}>
                            <input type="hidden" name="id" value={n.id} />
                            <Button size="sm" variant="outline" type="submit">
                              Delete
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
