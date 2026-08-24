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

function siteHost(siteUrl: string) {
  return new URL(siteUrl).hostname.replace(/^www\./, "");
}

export function indexNowKeyLocation(apiKey: string, siteUrl = getSiteUrl()) {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/api/indexnow/key`;
}

export async function submitIndexNow(urls: string[], config: IndexNowConfig): Promise<IndexNowResult> {
  const siteUrl = (config.siteUrl ?? getSiteUrl()).replace(/\/$/, "");
  const apiKey = config.apiKey.trim();
  if (!apiKey) {
    return { ok: false, submitted: 0, batches: 0, error: "INDEXNOW_API_KEY is not configured" };
  }
  if (urls.length === 0) {
    return { ok: true, submitted: 0, batches: 0 };
  }

  const host = siteHost(siteUrl);
  const keyLocation = config.keyLocation ?? indexNowKeyLocation(apiKey, siteUrl);
  let submitted = 0;
  let batches = 0;
  let lastStatus: number | undefined;
  let lastError: string | undefined;

  for (let i = 0; i < urls.length; i += INDEXNOW_BATCH_SIZE) {
    const batch = urls.slice(i, i + INDEXNOW_BATCH_SIZE);
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
    // 200 = accepted, 202 = accepted (async)
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
