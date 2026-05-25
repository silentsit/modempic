import { prisma } from "@/lib/db";
import {
  DEFAULT_ANALYTICS_STORE,
  parseAnalyticsStore,
  SOCIAL_PROOF_ANALYTICS_KEY,
  type SocialProofAnalyticsStore,
  type SocialProofEventType,
} from "./analytics-schema";
import { applyAnalyticsEvent } from "./analytics";

export { getNotificationAnalytics } from "./analytics";

export async function loadSocialProofAnalyticsStore(): Promise<SocialProofAnalyticsStore> {
  try {
    const row = await prisma.storeSetting.findUnique({ where: { key: SOCIAL_PROOF_ANALYTICS_KEY } });
    if (!row?.value) return DEFAULT_ANALYTICS_STORE;
    return parseAnalyticsStore(row.value);
  } catch {
    return DEFAULT_ANALYTICS_STORE;
  }
}

export async function saveSocialProofAnalyticsStore(store: SocialProofAnalyticsStore): Promise<void> {
  await prisma.storeSetting.upsert({
    where: { key: SOCIAL_PROOF_ANALYTICS_KEY },
    create: { key: SOCIAL_PROOF_ANALYTICS_KEY, value: store as object },
    update: { value: store as object },
  });
}

export async function recordSocialProofAnalyticsEvent(
  notificationId: string,
  event: SocialProofEventType,
): Promise<void> {
  const store = await loadSocialProofAnalyticsStore();
  const updated = applyAnalyticsEvent(store, notificationId, event);
  await saveSocialProofAnalyticsStore(updated);
}
