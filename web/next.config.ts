import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /** Browsing as http://127.0.0.1 vs http://localhost counts as cross-origin for dev assets and client fetches. */
  allowedDevOrigins: ["127.0.0.1", "localhost"],
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
