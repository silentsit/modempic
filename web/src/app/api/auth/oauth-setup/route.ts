import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSiteUrl } from "@/lib/site-url";

/** Public helper for configuring Google OAuth redirect URIs (no secrets). */
export function GET() {
  const origin = getSiteUrl();
  return NextResponse.json({
    googleRedirectUri: `${origin}/api/auth/callback/google`,
    googleConfigured: Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim()),
    authUrl: env.AUTH_URL ?? null,
    siteUrl: env.NEXT_PUBLIC_SITE_URL ?? null,
  });
}
