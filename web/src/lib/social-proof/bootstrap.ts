import { env } from "@/lib/env";
import { fetchRecentSocialProofActivity, mergeDemoIfEmpty } from "./queries";
import type { SocialProofBootstrap } from "./types";

export type { SocialProofBootstrap };

/** Server-only: initial payload for storefront social proof; null when disabled or empty. */
export async function loadSocialProofBootstrapOrNull(): Promise<SocialProofBootstrap | null> {
  if (process.env.NEXT_PUBLIC_SOCIAL_PROOF_ENABLED !== "1") return null;
  const windowDays = env.SOCIAL_PROOF_WINDOW_DAYS ?? 7;
  const showAggregate = process.env.NEXT_PUBLIC_SOCIAL_PROOF_AGGREGATE === "1";

  let data: Awaited<ReturnType<typeof fetchRecentSocialProofActivity>>;
  try {
    data = await fetchRecentSocialProofActivity({
      windowDays,
      take: 15,
      ...(showAggregate ? { aggregateHours: 24 } : {}),
    });
  } catch (err) {
    console.error("[social-proof] bootstrap query failed:", err instanceof Error ? err.message : err);
    data = { items: [] };
  }
  data = mergeDemoIfEmpty(data, env.SOCIAL_PROOF_DEMO_JSON);
  if (!data.items.length) return null;

  return {
    items: data.items,
    ...(data.aggregateCount != null && showAggregate
      ? { aggregateCount: data.aggregateCount, aggregateHours: data.aggregateHours }
      : {}),
    windowDays,
    showAggregate,
  };
}
