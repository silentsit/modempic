/**
 * Content-Security-Policy for the storefront.
 *
 * Next.js App Router still emits inline scripts/styles (hydration + next/script),
 * so those directives stay on 'unsafe-inline'. Dev also needs 'unsafe-eval' and
 * localhost websockets for Fast Refresh.
 *
 * Hosted card/crypto checkout opens in a new tab, so those origins are not
 * listed in frame-src. Cloudflare Insights is injected at the edge, not in-repo.
 */
export function contentSecurityPolicy(options?: { isDev?: boolean }): string {
  const isDev = options?.isDev ?? process.env.NODE_ENV !== "production";

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://news.google.com",
    "https://static.cloudflareinsights.com",
  ];

  const connectSrc = [
    "'self'",
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://www.googletagmanager.com",
    "https://*.googletagmanager.com",
    "https://news.google.com",
    "https://www.google.com",
    "https://res.cloudinary.com",
    "https://cloudflareinsights.com",
    "https://static.cloudflareinsights.com",
    ...(isDev ? ["http://localhost:*", "http://127.0.0.1:*", "ws://localhost:*", "ws://127.0.0.1:*", "ws:", "wss:"] : []),
  ];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "font-src": ["'self'", "data:"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'self'"],
    "frame-src": ["'self'", "https://www.googletagmanager.com", "https://news.google.com", "https://www.google.com"],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://res.cloudinary.com",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://*.google-analytics.com",
      "https://www.google.com",
      "https://i.pravatar.cc",
      "https://images.unsplash.com",
    ],
    "object-src": ["'none'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'"],
    "connect-src": connectSrc,
    "manifest-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
  };

  const parts = Object.entries(directives).map(([key, values]) => `${key} ${values.join(" ")}`);
  if (!isDev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}
