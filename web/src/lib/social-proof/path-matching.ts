/**
 * Client-safe path rules for showing the storefront social-proof toast.
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

function isExcludedPath(pathname: string, excludePaths: string[]): boolean {
  const p = pathname || "/";
  for (const raw of excludePaths) {
    const prefix = raw.trim().replace(/\/$/, "");
    if (!prefix) continue;
    if (p === prefix || p.startsWith(`${prefix}/`)) return true;
  }
  return false;
}

export function pathnameShowsSocialProofWithRules(
  pathname: string,
  paths: string[],
  excludePaths: string[] = [],
): boolean {
  if (isExcludedPath(pathname, excludePaths)) return false;
  if (!paths.length) return pathnameMatchesDefaultSocialProofRoutes(pathname);
  if (paths.includes("*")) return true;
  const p = pathname || "/";
  return paths.some((prefix) => {
    const base = prefix.trim().replace(/\/$/, "");
    if (!base || base === "/") return p === "/" || p === "";
    return p === base || p.startsWith(`${base}/`);
  });
}

/** Legacy env-based path allowlist; prefer `pathnameShowsSocialProofWithRules`. */
export function pathnameShowsSocialProof(pathname: string, envPaths?: string): boolean {
  const parts = parseAllowPrefixes(envPaths);
  if (!parts?.length) {
    return pathnameMatchesDefaultSocialProofRoutes(pathname);
  }
  return pathnameShowsSocialProofWithRules(pathname, parts, []);
}
