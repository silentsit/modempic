import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  fetchRecentSocialProofActivity,
  mergeDemoIfEmpty,
} from "@/lib/social-proof/queries";

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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const demoJson = env.SOCIAL_PROOF_DEMO_JSON;
  const defaultWindow = env.SOCIAL_PROOF_WINDOW_DAYS ?? 7;
  const windowDays = clampWindowDays(
    url.searchParams.has("windowDays") ? Number(url.searchParams.get("windowDays")) : defaultWindow,
    defaultWindow,
  );
  const take = clampTake(url.searchParams.has("take") ? Number(url.searchParams.get("take")) : undefined);
  const aggregateHours = parseAggHours(url.searchParams.get("aggregateHours"));

  const cacheKey = JSON.stringify({ windowDays, take: take ?? null, aggregateHours: aggregateHours ?? null });
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > now) {
    return NextResponse.json(hit.payload, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  }

  let data;
  try {
    data = await fetchRecentSocialProofActivity({
      windowDays,
      ...(take != null ? { take } : {}),
      ...(aggregateHours != null ? { aggregateHours } : {}),
    });
  } catch (err) {
    console.error("[social-proof] GET query failed:", err instanceof Error ? err.message : err);
    data = { items: [] };
  }
  data = mergeDemoIfEmpty(data, demoJson);

  cache.set(cacheKey, { expires: now + CACHE_TTL_MS, payload: data });
  if (cache.size > 50) {
    for (const key of cache.keys()) {
      cache.delete(key);
      if (cache.size <= 40) break;
    }
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
