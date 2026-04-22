import { env } from "@/lib/env";

/** Canonical site origin for return URLs, redirects, and emails. */
export function getSiteUrl(): string {
  if (env.AUTH_URL) return env.AUTH_URL.replace(/\/$/, "");
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
