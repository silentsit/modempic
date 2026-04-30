import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

/** Exposed to the client so next-auth/react can parse basePath consistently (see __NEXTAUTH in next-auth/react.js). */
const nextAuthPublicUrl =
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "http://localhost:3000";

const nextConfig: NextConfig = {
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
  /** Parent folder may have another `package-lock.json`; pin dev bundler to this app. */
  turbopack: { root: appRoot },
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
};

export default nextConfig;
