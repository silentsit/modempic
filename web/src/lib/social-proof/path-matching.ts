/**
 * Client-safe path rules for showing the storefront social-proof toast.
 * `NEXT_PUBLIC_SOCIAL_PROOF_PATHS`: comma-separated path prefixes for allowlist mode.
 * Use `*` alone to enable on all routes.
 */
export function pathnameMatchesDefaultSocialProofRoutes(pathname: string): boolean {
  const p = pathname || "/";
  if (
    p === "/checkout" ||
    p.startsWith("/checkout/") ||
    p.startsWith("/cart") ||
    p.startsWith("/account") ||
    p.startsWith("/admin") ||
    p.startsWith("/login") ||
    p.startsWith("/register") ||
    p.startsWith("/order")
  ) {
    return false;
  }
  return p === "/" || p.startsWith("/shop") || p.startsWith("/product");
}

function parseAllowPrefixes(raw: string | undefined): string[] | null {
  if (!raw?.trim()) return null;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function pathnameShowsSocialProof(pathname: string, envPaths?: string): boolean {
  const parts = parseAllowPrefixes(envPaths);
  if (!parts?.length) {
    return pathnameMatchesDefaultSocialProofRoutes(pathname);
  }
  if (parts.includes("*")) return true;
  const p = pathname || "/";
  return parts.some((prefix) => {
    const base = prefix.replace(/\/$/, "");
    if (!base) return p === "/" || p === "";
    return p === base || p.startsWith(`${base}/`);
  });
}
