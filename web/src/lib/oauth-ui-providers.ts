import { env } from "@/lib/env";

/** Must stay aligned with `src/auth.ts` — only list providers that NextAuth actually registers. */
export function oauthSocialProvidersForUi(): { id: string; label: string }[] {
  return [
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? { id: "google", label: "Google" } : null,
    env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET ? { id: "linkedin", label: "LinkedIn" } : null,
    env.INSTAGRAM_CLIENT_ID && env.INSTAGRAM_CLIENT_SECRET ? { id: "instagram", label: "Instagram" } : null,
  ].filter((p): p is { id: string; label: string } => Boolean(p));
}
