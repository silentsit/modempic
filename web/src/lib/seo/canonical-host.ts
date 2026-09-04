/** Apex host we want Google to treat as the only public origin. */
export const CANONICAL_PUBLIC_HOST = "modempic.com";

export function requestHostname(hostHeader: string | null | undefined): string {
  if (!hostHeader) return "";
  return hostHeader.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
}

export function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function isCanonicalPublicHostname(hostname: string) {
  return hostname === CANONICAL_PUBLIC_HOST || hostname === `www.${CANONICAL_PUBLIC_HOST}`;
}

/** Production leftover `*.vercel.app` aliases should 308 to the apex so they cannot be indexed. */
export function shouldRedirectVercelAppToCanonical(hostname: string, vercelEnv = process.env.VERCEL_ENV) {
  return vercelEnv === "production" && hostname.endsWith(".vercel.app");
}

/** Preview / accidental hosts must not enter the index even if they return 200. */
export function shouldNoindexNonCanonicalHost(hostname: string) {
  if (!hostname || isLocalHostname(hostname) || isCanonicalPublicHostname(hostname)) return false;
  return true;
}
