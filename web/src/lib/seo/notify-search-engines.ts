import { collectPublicUrls, sitemapIndexUrl } from "@/lib/seo/collect-public-urls";
import { submitIndexNow } from "@/lib/seo/indexnow";
import { submitSitemapToSearchConsole } from "@/lib/seo/search-console";
import { getSiteUrl } from "@/lib/site-url";

export type SeoNotifyOptions = {
  indexNow?: boolean;
  googleSearchConsole?: boolean;
  siteUrl?: string;
  indexNowApiKey?: string;
  googleServiceAccountJson?: string;
  googleSearchConsoleSiteUrl?: string;
  /** When false, blocks notify on localhost unless SEO_NOTIFY_ALLOW_DEV=1. */
  allowDev?: boolean;
};

export type SeoNotifyChannelResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
  submitted?: number;
  batches?: number;
  status?: number;
  sitemapUrl?: string;
};

export type SeoNotifyResult = {
  ok: boolean;
  at: string;
  siteUrl: string;
  urlCount: number;
  indexNow?: SeoNotifyChannelResult;
  googleSearchConsole?: SeoNotifyChannelResult;
  blockedReason?: string;
};

function isLocalSiteUrl(siteUrl: string) {
  try {
    const host = new URL(siteUrl).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

function envFlag(name: string) {
  return process.env[name]?.trim() === "1";
}

export async function notifySearchEngines(options: SeoNotifyOptions = {}): Promise<SeoNotifyResult> {
  const siteUrl = (options.siteUrl ?? getSiteUrl()).replace(/\/$/, "");
  const at = new Date().toISOString();
  const allowDev = options.allowDev ?? envFlag("SEO_NOTIFY_ALLOW_DEV");

  if (isLocalSiteUrl(siteUrl) && !allowDev) {
    return {
      ok: false,
      at,
      siteUrl,
      urlCount: 0,
      blockedReason: "Notifications are disabled on localhost. Set SEO_NOTIFY_ALLOW_DEV=1 to override.",
    };
  }

  const urls = await collectPublicUrls(siteUrl);
  const result: SeoNotifyResult = {
    ok: true,
    at,
    siteUrl,
    urlCount: urls.length,
  };

  if (options.indexNow) {
    const apiKey = options.indexNowApiKey ?? process.env.INDEXNOW_API_KEY ?? "";
    if (!apiKey.trim()) {
      result.indexNow = { ok: false, skipped: true, reason: "INDEXNOW_API_KEY not configured" };
      result.ok = false;
    } else {
      const indexNow = await submitIndexNow(urls, {
        apiKey,
        siteUrl,
      });
      result.indexNow = {
        ok: indexNow.ok,
        submitted: indexNow.submitted,
        batches: indexNow.batches,
        status: indexNow.status,
        error: indexNow.error,
      };
      if (!indexNow.ok) result.ok = false;
    }
  }

  if (options.googleSearchConsole) {
    const json = options.googleServiceAccountJson ?? process.env.GOOGLE_SEARCH_CONSOLE_JSON ?? "";
    const gscSite =
      options.googleSearchConsoleSiteUrl ??
      process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL ??
      `${siteUrl}/`;

    if (!json.trim()) {
      result.googleSearchConsole = {
        ok: false,
        skipped: true,
        reason: "GOOGLE_SEARCH_CONSOLE_JSON not configured",
      };
      result.ok = false;
    } else {
      const sitemapUrl = sitemapIndexUrl(siteUrl);
      const gsc = await submitSitemapToSearchConsole(sitemapUrl, {
        serviceAccountJson: json,
        siteUrl: gscSite,
      });
      result.googleSearchConsole = {
        ok: gsc.ok,
        sitemapUrl: gsc.sitemapUrl,
        status: gsc.status,
        error: gsc.error,
      };
      if (!gsc.ok) result.ok = false;
    }
  }

  return result;
}

export const SEO_NOTIFY_LAST_RUN_KEY = "seo.notify.lastRun";
