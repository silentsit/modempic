import { getSiteUrl } from "@/lib/site-url";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
/** IndexNow accepts up to 10,000 URLs per request. */
export const INDEXNOW_BATCH_SIZE = 10_000;

export type IndexNowConfig = {
  apiKey: string;
  siteUrl?: string;
  keyLocation?: string;
};

export type IndexNowResult = {
  ok: boolean;
  submitted: number;
  batches: number;
  status?: number;
  error?: string;
};

/** Canonical https origin — strips www so IndexNow host matches sitemap URLs (www → apex redirect). */
export function canonicalIndexNowOrigin(siteUrl: string) {
  const u = new URL(siteUrl.includes("://") ? siteUrl : `https://${siteUrl}`);
  u.protocol = "https:";
  u.hostname = u.hostname.replace(/^www\./i, "");
  u.pathname = "";
  u.search = "";
  u.hash = "";
  return u.origin;
}

function indexNowHost(origin: string) {
  return new URL(origin).hostname;
}

/** IndexNow spec: host `/{key}.txt` at site root (rewritten to /api/indexnow/key in next.config). */
export function indexNowKeyLocation(apiKey: string, siteUrl = getSiteUrl()) {
  const origin = canonicalIndexNowOrigin(siteUrl);
  return `${origin}/${apiKey.trim()}.txt`;
}

/** Rewrite same-site URLs onto the canonical origin; drop anything off-host. */
export function normalizeIndexNowUrls(urls: string[], siteUrl: string) {
  const origin = canonicalIndexNowOrigin(siteUrl);
  const allowedHost = indexNowHost(origin);

  return [
    ...new Set(
      urls
        .map((raw) => {
          try {
            const u = new URL(raw);
            const host = u.hostname.replace(/^www\./i, "");
            if (host !== allowedHost) return null;
            u.protocol = "https:";
            u.hostname = allowedHost;
            u.hash = "";
            return u.toString();
          } catch {
            return null;
          }
        })
        .filter((url): url is string => Boolean(url)),
    ),
  ];
}

export async function submitIndexNow(urls: string[], config: IndexNowConfig): Promise<IndexNowResult> {
  const siteUrl = config.siteUrl ?? getSiteUrl();
  const apiKey = config.apiKey.trim();
  if (!apiKey) {
    return { ok: false, submitted: 0, batches: 0, error: "INDEXNOW_API_KEY is not configured" };
  }

  const origin = canonicalIndexNowOrigin(siteUrl);
  const normalized = normalizeIndexNowUrls(urls, origin);
  if (normalized.length === 0) {
    return { ok: false, submitted: 0, batches: 0, error: "No valid same-host URLs to submit" };
  }

  const host = indexNowHost(origin);
  const keyLocation = config.keyLocation ?? indexNowKeyLocation(apiKey, origin);
  let submitted = 0;
  let batches = 0;
  let lastStatus: number | undefined;
  let lastError: string | undefined;

  for (let i = 0; i < normalized.length; i += INDEXNOW_BATCH_SIZE) {
    const batch = normalized.slice(i, i + INDEXNOW_BATCH_SIZE);
    batches += 1;

    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: apiKey,
        keyLocation,
        urlList: batch,
      }),
    });

    lastStatus = res.status;
    if (res.status === 200 || res.status === 202) {
      submitted += batch.length;
      continue;
    }

    const body = await res.text().catch(() => "");
    lastError = body.trim() || `IndexNow HTTP ${res.status}`;
    return { ok: false, submitted, batches, status: lastStatus, error: lastError };
  }

  return { ok: true, submitted, batches, status: lastStatus };
}
