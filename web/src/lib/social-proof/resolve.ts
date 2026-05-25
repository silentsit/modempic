import { env } from "@/lib/env";
import type { FallbackMode, SocialProofDemoItem } from "./schema";
import {
  fetchRecentSocialProofActivity,
  mergeDemoIfEmpty,
  parseDemoItemsJson,
  type SocialProofActivityItemDto,
  type SocialProofQueryResult,
} from "./queries";
import { generateSyntheticActivity } from "./synthetic";
import { sanitizeActivityItemsToPublishedCatalog } from "./catalog-products";

export type SocialProofDataSource = "real" | "demo" | "synthetic" | "none";

export type ResolvedSocialProofActivity = SocialProofQueryResult & {
  source: SocialProofDataSource;
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
  aggregateHours?: number;
  maxAgeHours?: number;
  fallbackMode: FallbackMode;
  demoItems?: SocialProofDemoItem[];
  showLocation?: boolean;
  includeComboAggregate?: boolean;
}): Promise<ResolvedSocialProofActivity> {
  const take = options.take ?? 15;
  const maxAgeHours = options.maxAgeHours ?? 72;

  let data = await fetchRecentSocialProofActivity({
    windowDays: options.windowDays,
    take,
    ...(options.includeComboAggregate && options.aggregateHours
      ? { aggregateHours: options.aggregateHours }
      : {}),
  });

  data = {
    ...data,
    items: await sanitizeActivityItemsToPublishedCatalog(filterByMaxAge(data.items, maxAgeHours)),
  };

  if (data.items.length > 0) {
    return { ...data, source: "real" };
  }

  if (options.fallbackMode === "off") {
    return { items: [], source: "none" };
  }

  if (options.fallbackMode === "demo_only") {
    const adminDemo = await sanitizeActivityItemsToPublishedCatalog(
      demoItemsToDto(options.demoItems ?? []),
    );
    const envDemo = await sanitizeActivityItemsToPublishedCatalog(parseDemoItemsJson(env.SOCIAL_PROOF_DEMO_JSON));
    const merged = adminDemo.length ? adminDemo : envDemo;
    const filtered = filterByMaxAge(merged, maxAgeHours);
    if (filtered.length > 0) {
      return { items: filtered, source: "demo" };
    }
    return { items: [], source: "none" };
  }

  // auto: admin demo → env demo → synthetic
  const adminDemo = await sanitizeActivityItemsToPublishedCatalog(demoItemsToDto(options.demoItems ?? []));
  if (adminDemo.length) {
    const filtered = filterByMaxAge(adminDemo, maxAgeHours);
    if (filtered.length) return { items: filtered, source: "demo" };
  }

  const withEnvDemo = mergeDemoIfEmpty({ items: [] }, env.SOCIAL_PROOF_DEMO_JSON);
  if (withEnvDemo.items.length) {
    const filtered = filterByMaxAge(
      await sanitizeActivityItemsToPublishedCatalog(withEnvDemo.items),
      maxAgeHours,
    );
    if (filtered.length) return { ...withEnvDemo, items: filtered, source: "demo" };
  }

  const synthetic = await generateSyntheticActivity({
    count: take,
    windowDays: options.windowDays,
    showLocation: options.showLocation,
  });
  return {
    items: filterByMaxAge(synthetic, maxAgeHours),
    source: "synthetic",
  };
}
