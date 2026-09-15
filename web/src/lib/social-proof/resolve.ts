import { env } from "@/lib/env";
import type { FallbackMode, SocialProofDemoItem } from "./schema";
import {
  fetchRecentSocialProofActivity,
  parseDemoItemsJson,
  type SocialProofActivityItemDto,
  type SocialProofQueryResult,
} from "./queries";
import { sanitizeActivityItemsToPublishedCatalog } from "./catalog-products";
import { generateStreamAggregates, type StreamAggregateDto } from "./stream-aggregates";

export type SocialProofDataSource = "real" | "demo" | "synthetic" | "none";

export type ResolvedSocialProofActivity = SocialProofQueryResult & {
  source: SocialProofDataSource;
  streamAggregates: StreamAggregateDto[];
};

function demoItemsToDto(items: SocialProofDemoItem[]): SocialProofActivityItemDto[] {
  return parseDemoItemsJson(JSON.stringify(items));
}

function filterByMaxAge(items: SocialProofActivityItemDto[], maxAgeHours: number): SocialProofActivityItemDto[] {
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  return items.filter((item) => {
    const t = Date.parse(item.completedAtIso);
    return !Number.isNaN(t) && t >= cutoff;
  });
}

export async function resolveSocialProofActivity(options: {
  windowDays: number;
  take?: number;
  maxAgeHours?: number;
  fallbackMode: FallbackMode;
  demoItems?: SocialProofDemoItem[];
  showLocation?: boolean;
  streamNotificationId?: string;
}): Promise<ResolvedSocialProofActivity> {
  const take = options.take ?? 15;
  const maxAgeHours = options.maxAgeHours ?? 72;

  let data = await fetchRecentSocialProofActivity({
    windowDays: options.windowDays,
    take,
  });

  data = {
    ...data,
    items: await sanitizeActivityItemsToPublishedCatalog(filterByMaxAge(data.items, maxAgeHours)),
  };

  const streamAggregates = await generateStreamAggregates({
    streamNotificationId: options.streamNotificationId,
  });

  if (data.items.length > 0) {
    return { ...data, source: "real", streamAggregates };
  }

  if (options.fallbackMode !== "demo_only") {
    return { items: [], source: "none", streamAggregates };
  }

  const adminDemo = await sanitizeActivityItemsToPublishedCatalog(demoItemsToDto(options.demoItems ?? []));
  const envDemo = await sanitizeActivityItemsToPublishedCatalog(parseDemoItemsJson(env.SOCIAL_PROOF_DEMO_JSON));
  const merged = adminDemo.length ? adminDemo : envDemo;
  const filtered = filterByMaxAge(merged, maxAgeHours);
  if (filtered.length > 0) {
    return { items: filtered, source: "demo", streamAggregates };
  }
  return { items: [], source: "none", streamAggregates };
}
