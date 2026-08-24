import crypto from "crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters";

export type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
};

export type SearchConsoleSubmitResult = {
  ok: boolean;
  sitemapUrl?: string;
  status?: number;
  error?: string;
};

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function parseServiceAccountJson(raw: string): GoogleServiceAccount | null {
  try {
    const parsed = JSON.parse(raw) as Partial<GoogleServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) return null;
    return { client_email: parsed.client_email, private_key: parsed.private_key };
  } catch {
    return null;
  }
}

async function getAccessToken(credentials: GoogleServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: WEBMASTERS_SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(credentials.private_key, "base64url");
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body.trim() || `Google token HTTP ${res.status}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google token response missing access_token");
  return data.access_token;
}

/** Normalize GSC site URL (must match Search Console property, trailing slash for URL-prefix). */
export function normalizeSearchConsoleSiteUrl(siteUrl: string) {
  const trimmed = siteUrl.trim();
  if (!trimmed) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.pathname === "/" || u.pathname === "") {
      return `${u.origin}/`;
    }
    return u.toString();
  } catch {
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  }
}

export async function submitSitemapToSearchConsole(
  sitemapUrl: string,
  options: { serviceAccountJson: string; siteUrl: string },
): Promise<SearchConsoleSubmitResult> {
  const credentials = parseServiceAccountJson(options.serviceAccountJson);
  if (!credentials) {
    return { ok: false, error: "GOOGLE_SEARCH_CONSOLE_JSON is missing or invalid JSON" };
  }

  const site = encodeURIComponent(normalizeSearchConsoleSiteUrl(options.siteUrl));
  const feed = encodeURIComponent(sitemapUrl);
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${site}/sitemaps/${feed}`;

  try {
    const token = await getAccessToken(credentials);
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok || res.status === 204) {
      return { ok: true, sitemapUrl, status: res.status };
    }

    const body = await res.text().catch(() => "");
    return {
      ok: false,
      sitemapUrl,
      status: res.status,
      error: body.trim() || `Search Console HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      ok: false,
      sitemapUrl,
      error: e instanceof Error ? e.message : "Search Console submit failed",
    };
  }
}
