import { NextResponse } from "next/server";
import {
  isSocialProofGloballyEnabled,
  loadSocialProofStore,
  pickActiveComboNotification,
  pickActiveStreamNotification,
  pickPrimaryDisplayNotification,
} from "@/lib/social-proof/config";
import { resolveSocialProofActivity } from "@/lib/social-proof/resolve";
import { generateComboSlides } from "@/lib/social-proof/stream-aggregates";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 15_000;
const cache = new Map<string, { expires: number; payload: unknown }>();

function clampWindowDays(n: number | undefined, fallback: number): number {
  if (n == null || !Number.isFinite(n)) return fallback;
  const f = Math.floor(n);
  return Math.min(14, Math.max(1, f));
}

function clampTake(n: number | undefined): number | undefined {
  if (n == null || !Number.isFinite(n)) return undefined;
  return Math.min(25, Math.max(1, Math.floor(n)));
}

function parseAggHours(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(720, Math.max(1, Math.floor(n)));
}

function stripSynthetic<T extends { synthetic?: boolean }>(items: T[]): Omit<T, "synthetic">[] {
  return items.map((item) => {
    const { synthetic: _ignored, ...rest } = item;
    void _ignored;
    return rest;
  });
}

export async function GET(req: Request) {
  const store = await loadSocialProofStore();
  if (!isSocialProofGloballyEnabled(store.global)) {
    return NextResponse.json({ items: [] }, { status: 404 });
  }

  const primary = pickPrimaryDisplayNotification(store);
  if (!primary) {
    return NextResponse.json({ items: [] }, { status: 404 });
  }

  const stream = pickActiveStreamNotification(store);
  const combo = pickActiveComboNotification(store);
  const url = new URL(req.url);
  const cfg = stream?.config ?? primary.config;
  const defaultWindow = cfg.windowDays;
  const windowDays = clampWindowDays(
    url.searchParams.has("windowDays") ? Number(url.searchParams.get("windowDays")) : defaultWindow,
    defaultWindow,
  );
  const take = clampTake(url.searchParams.has("take") ? Number(url.searchParams.get("take")) : undefined);
  const aggregateHours =
    parseAggHours(url.searchParams.get("aggregateHours")) ?? combo?.config.aggregateHours ?? cfg.aggregateHours;

  const cacheKey = JSON.stringify({
    windowDays,
    take: take ?? null,
    aggregateHours: aggregateHours ?? null,
    fallback: store.global.fallbackMode,
    comboId: combo?.id ?? null,
    streamId: stream?.id ?? primary.id,
  });
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > now) {
    return NextResponse.json(hit.payload, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
      },
    });
  }

  let data;
  try {
    data = await resolveSocialProofActivity({
      windowDays,
      ...(take != null ? { take } : {}),
      maxAgeHours: cfg.maxAgeHours,
      fallbackMode: store.global.fallbackMode,
      demoItems: store.global.demoItems,
      showLocation: cfg.showLocation,
      streamNotificationId: stream?.id ?? primary.id,
    });
  } catch (err) {
    console.error("[social-proof] GET query failed:", err instanceof Error ? err.message : err);
    data = { items: [], source: "none" as const, streamAggregates: [] };
  }

  const payload = {
    items: stripSynthetic(data.items),
    streamAggregates: data.streamAggregates,
    ...(combo
      ? {
          comboSlides: await generateComboSlides({
            comboNotificationId: combo.id,
            aggregateHours: aggregateHours ?? 24,
          }),
        }
      : {}),
  };

  cache.set(cacheKey, { expires: now + CACHE_TTL_MS, payload });
  if (cache.size > 50) {
    for (const key of cache.keys()) {
      cache.delete(key);
      if (cache.size <= 40) break;
    }
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
    },
  });
}
