/** Strip localhost (or foreign origins) from NextAuth callback URLs on the live site. */
export function resolveClientPostLoginRedirect(
  authUrl: string | null | undefined,
  fallbackPath: string,
): string {
  const fallback = fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`;

  if (!authUrl?.trim()) return fallback;

  try {
    const parsed = new URL(authUrl, typeof window !== "undefined" ? window.location.origin : undefined);
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;

    if (typeof window === "undefined") {
      return path.startsWith("/") ? path : fallback;
    }

    const onLocalDev =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const targetIsLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    // Misconfigured AUTH_URL on production — keep path, drop localhost origin.
    if (targetIsLocal && !onLocalDev) {
      return path.startsWith("/") ? path : fallback;
    }

    if (parsed.origin === window.location.origin) {
      return path.startsWith("/") ? path : fallback;
    }

    return authUrl;
  } catch {
    return fallback;
  }
}
