import type { NextConfig } from "next";
import path from "path";

/** Monorepo root (contains root `package-lock.json` next to `web/`). Resolves ambiguous tracing when two lockfiles exist. */
const monorepoRoot = path.resolve(__dirname, "..");

/** Exposed to the client so next-auth/react can parse basePath consistently (see __NEXTAUTH in next-auth/react.js). */
const nextAuthPublicUrl =
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "http://localhost:3000";

const nextConfig: NextConfig = {
  /** Silence “multiple lockfiles” inference warning on Vercel; match runtime file tracing to repo root + `web/`. */
  outputFileTracingRoot: monorepoRoot,
  /**
   * Resend is a Node SDK; bundling it into webpack server chunks can produce missing
   * `./vendor-chunks/resend.js` runtime errors on pages that only transitively import email code (e.g. admin actions).
   */
  serverExternalPackages: ["resend", "@react-email/render", "react-email"],
  env: {
    NEXTAUTH_URL: nextAuthPublicUrl,
  },
  /**
   * Hostnames you use in the browser bar during `next dev` (not only localhost).
   * Missing entries can break dev middleware / RSC and contribute to auth client fetch failures.
   */
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "noofoxxx.local",
    "www.noofoxxx.local",
  ],
  /**
   * Avoid setting `turbopack.root` to this app folder: Next can mis-resolve `@import` in CSS (Tailwind breaks),
   * leaving pages effectively unstyled in `next dev --turbopack`. See Next.js discussion around turbopack root + CSS.
   */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      /** Pulled migrations / legacy hotlinks — prefer self-hosted uploads later. */
      { protocol: "https", hostname: "noofox.com", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "www.noofox.com", pathname: "/wp-content/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  /**
   * Permanent redirects collapse historical aliases onto canonical URLs.
   * Crawlers consolidate ranking signals; we keep duplicate routes from competing.
   */
  async redirects() {
    return [
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/terms", destination: "/terms-of-service", permanent: true },
      { source: "/refunds", destination: "/refund-policy", permanent: true },
      { source: "/return-policy", destination: "/refund-policy", permanent: true },
    ];
  },
};

export default nextConfig;
