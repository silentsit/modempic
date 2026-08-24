import { prisma } from "@/lib/db";
import { notifySearchEnginesAction } from "@/lib/actions/seo-notify";
import { SEO_NOTIFY_LAST_RUN_KEY, type SeoNotifyResult } from "@/lib/seo/notify-search-engines";
import { setStoreSettingAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type SeoNotifyLastRun = SeoNotifyResult & { triggeredBy?: string };

function noticeText(notice: string | undefined) {
  switch (notice) {
    case "notify_ok":
      return "Search engines notified successfully.";
    case "notify_partial":
      return "Notification finished with errors — see last run details below.";
    case "notify_none_selected":
      return "Select at least one channel (IndexNow or Google Search Console).";
    default:
      return null;
  }
}

function formatChannel(label: string, channel: SeoNotifyResult["indexNow"] | undefined) {
  if (!channel) return null;
  if (channel.skipped) {
    return `${label}: skipped (${channel.reason ?? "not configured"})`;
  }
  if (channel.ok) {
    if (label === "IndexNow" && channel.submitted != null) {
      return `${label}: OK — ${channel.submitted} URL(s) in ${channel.batches ?? 1} batch(es)`;
    }
    if (label === "Google Search Console" && channel.sitemapUrl) {
      return `${label}: OK — resubmitted ${channel.sitemapUrl}`;
    }
    return `${label}: OK`;
  }
  return `${label}: failed — ${channel.error ?? "unknown error"}`;
}

export default async function AdminSeoPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const notice = typeof params.notice === "string" ? params.notice : params.notice?.[0];
  const noticeMsg = noticeText(notice);

  const [cats, products, settings] = await Promise.all([
    prisma.category.findMany(),
    prisma.product.findMany({ take: 50 }),
    prisma.storeSetting.findMany(),
  ]);

  const lastRunRaw = settings.find((s) => s.key === SEO_NOTIFY_LAST_RUN_KEY)?.value;
  const lastRun = (lastRunRaw && typeof lastRunRaw === "object" ? lastRunRaw : null) as SeoNotifyLastRun | null;

  const indexNowConfigured = Boolean(process.env.INDEXNOW_API_KEY?.trim());
  const gscConfigured = Boolean(process.env.GOOGLE_SEARCH_CONSOLE_JSON?.trim());

  return (
    <div>
      <h1 className="text-2xl font-bold">SEO controls</h1>
      <p className="text-sm text-[var(--muted-foreground)]">Defaults + per-entity title/description in catalog.</p>

      {noticeMsg ? (
        <p className="mt-3 rounded-md border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-sm">
          {noticeMsg}
        </p>
      ) : null}

      <h2 className="mt-6 font-medium">Notify search engines</h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
        Pings IndexNow (Bing, Yandex, and partners) with every public URL from your sitemaps, and/or asks Google
        Search Console to recrawl <code className="text-xs">sitemap.xml</code>. This does not guarantee instant
        Google indexing for every product URL.
      </p>

      <form action={notifySearchEnginesAction} className="mt-3 max-w-xl space-y-3 rounded-lg border border-[var(--border)] p-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="indexNow"
            name="indexNow"
            defaultChecked
            className="h-4 w-4"
            disabled={!indexNowConfigured}
          />
          <Label htmlFor="indexNow" className="font-normal">
            IndexNow {indexNowConfigured ? "" : "(set INDEXNOW_API_KEY in env)"}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="googleSearchConsole"
            name="googleSearchConsole"
            defaultChecked
            className="h-4 w-4"
            disabled={!gscConfigured}
          />
          <Label htmlFor="googleSearchConsole" className="font-normal">
            Google Search Console sitemap resubmit{" "}
            {gscConfigured ? "" : "(set GOOGLE_SEARCH_CONSOLE_JSON + GOOGLE_SEARCH_CONSOLE_SITE_URL)"}
          </Label>
        </div>
        <Button type="submit" size="sm">
          Notify search engines
        </Button>
      </form>

      {lastRun ? (
        <div className="mt-4 max-w-2xl rounded-lg border border-[var(--border)] p-4 text-sm">
          <h3 className="font-medium">Last run</h3>
          <ul className="mt-2 space-y-1 text-[var(--muted-foreground)]">
            <li>
              {new Date(lastRun.at).toLocaleString()} — {lastRun.urlCount} URL(s)
              {lastRun.triggeredBy ? ` — by ${lastRun.triggeredBy}` : ""}
            </li>
            {formatChannel("IndexNow", lastRun.indexNow) ? (
              <li>{formatChannel("IndexNow", lastRun.indexNow)}</li>
            ) : null}
            {formatChannel("Google Search Console", lastRun.googleSearchConsole) ? (
              <li>{formatChannel("Google Search Console", lastRun.googleSearchConsole)}</li>
            ) : null}
            {lastRun.blockedReason ? <li>{lastRun.blockedReason}</li> : null}
          </ul>
        </div>
      ) : null}

      <h2 className="mt-8 font-medium">Default metadata (StoreSetting JSON)</h2>
      <form action={setStoreSettingAction} className="mt-2 max-w-xl space-y-2">
        <input type="hidden" name="key" value="seo.defaults" />
        <Label htmlFor="v">Value</Label>
        <Textarea
          id="v"
          name="value"
          rows={3}
          className="font-mono text-sm"
          defaultValue={JSON.stringify(
            (settings.find((s) => s.key === "seo.defaults")?.value as object) ?? { title: "Modempic", desc: "..." },
            null,
            2,
          )}
        />
        <Button type="submit" size="sm" variant="secondary">
          Save defaults
        </Button>
      </form>
      <h2 className="mt-6 text-sm font-medium">Categories (edit in DB or add admin CRUD later)</h2>
      <ul className="mt-1 text-xs text-[var(--muted-foreground)]">
        {cats.map((c) => (
          <li key={c.id}>
            {c.slug} — {c.seoTitle ?? c.name}
          </li>
        ))}
      </ul>
      <h2 className="mt-4 text-sm font-medium">Sample products</h2>
      <ul className="mt-1 text-xs text-[var(--muted-foreground)]">
        {products.slice(0, 10).map((p) => (
          <li key={p.id}>
            {p.slug} — {p.seoTitle ?? p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
