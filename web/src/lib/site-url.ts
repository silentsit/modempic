import { env } from "@/lib/env";

function trimOrigin(url: string) {
  return url.replace(/\/$/, "");
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function tryOrigin(candidate: string | undefined) {
  if (!candidate) return null;
  const t = candidate.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    // Paymento and other gateways require HTTPS return URLs in production.
    if (process.env.NODE_ENV === "production" && u.protocol === "http:" && !isLocalHost(u.hostname)) {
      u.protocol = "https:";
    }
    return trimOrigin(u.toString());
  } catch {
    /* invalid */
  }
  return null;
}

/**
 * Canonical site origin (metadata, redirects, return URLs, emails).
 * Order: `AUTH_URL` → `NEXT_PUBLIC_SITE_URL` → Vercel preview URL → localhost.
 * Never throws (avoids 500 from `new URL('')` when env is mis-set).
 */
export function getSiteUrl(): string {
  return (
    tryOrigin(env.AUTH_URL) ??
    tryOrigin(env.NEXT_PUBLIC_SITE_URL) ??
    (process.env.VERCEL_URL ? tryOrigin(`https://${process.env.VERCEL_URL}`) : null) ??
    "http://localhost:3000"
  );
}
