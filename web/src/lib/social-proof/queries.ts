import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { composeSocialProofMessage, type ComposeParams } from "./compose-notification";

export type SocialProofActivityItemDto = {
  message: string;
  completedAtIso: string;
  productHint?: string;
};

export type SocialProofQueryResult = {
  items: SocialProofActivityItemDto[];
  aggregateCount?: number;
  aggregateHours?: number;
};

const MAX_TAKE = 25;
const MAX_WINDOW_DAYS = 14;

function clampWindowDays(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 7;
  return Math.min(Math.floor(n), MAX_WINDOW_DAYS);
}

function clampTake(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 10;
  return Math.min(Math.floor(n), MAX_TAKE);
}

function daysAgo(d: Date, days: number): Date {
  const t = new Date(d);
  t.setUTCDate(t.getUTCDate() - days);
  return t;
}

function hoursAgo(d: Date, hours: number): Date {
  const t = new Date(d);
  t.setUTCHours(t.getUTCHours() - hours);
  return t;
}

export async function fetchRecentSocialProofActivity(options: {
  now?: Date;
  windowDays?: number;
  take?: number;
  aggregateHours?: number;
}): Promise<SocialProofQueryResult> {
  const now = options.now ?? new Date();
  const windowDays = clampWindowDays(options.windowDays ?? 7);
  const take = clampTake(options.take ?? 12);
  const since = daysAgo(now, windowDays);

  const rows = await prisma.order.findMany({
    where: {
      status: OrderStatus.COMPLETED,
      completedAt: { gte: since, not: null },
    },
    orderBy: { completedAt: "desc" },
    take,
    select: {
      completedAt: true,
      shippingAddress: {
        select: { fullName: true, city: true, state: true, country: true },
      },
      user: { select: { name: true } },
      lines: {
        orderBy: { id: "asc" },
        take: 1,
        select: { title: true },
      },
    },
  });

  const items: SocialProofActivityItemDto[] = [];
  for (const row of rows) {
    const at = row.completedAt;
    if (!at) continue;
    const compose: ComposeParams = {
      shippingFullName: row.shippingAddress?.fullName ?? null,
      userName: row.user?.name ?? null,
      city: row.shippingAddress?.city ?? null,
      state: row.shippingAddress?.state ?? null,
      country: row.shippingAddress?.country ?? null,
      primaryLineTitle: row.lines[0]?.title ?? null,
    };
    const { message, productHint } = composeSocialProofMessage(compose);
    items.push({
      message,
      completedAtIso: at.toISOString(),
      ...(productHint ? { productHint } : {}),
    });
  }

  let aggregateCount: number | undefined;
  const aggH = options.aggregateHours;
  if (aggH != null && Number.isFinite(aggH) && aggH > 0 && aggH <= 720) {
    const h = Math.floor(aggH);
    const aggSince = hoursAgo(now, h);
    aggregateCount = await prisma.order.count({
      where: {
        status: OrderStatus.COMPLETED,
        completedAt: { gte: aggSince, not: null },
      },
    });
  }

  return {
    items,
    ...(aggregateCount != null ? { aggregateCount, aggregateHours: Math.floor(Number(aggH)) } : {}),
  };
}

export function parseDemoItemsJson(raw: string | undefined | null): SocialProofActivityItemDto[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: SocialProofActivityItemDto[] = [];
    for (const el of parsed) {
      if (!el || typeof el !== "object") continue;
      const o = el as Record<string, unknown>;
      const message = typeof o.message === "string" ? o.message.trim() : "";
      const iso = typeof o.completedAtIso === "string" ? o.completedAtIso.trim() : "";
      if (!message || !iso) continue;
      const d = Date.parse(iso);
      if (Number.isNaN(d)) continue;
      out.push({
        message,
        completedAtIso: new Date(iso).toISOString(),
        ...(typeof o.productHint === "string" && o.productHint.trim()
          ? { productHint: o.productHint.trim() }
          : {}),
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function mergeDemoIfEmpty(
  result: SocialProofQueryResult,
  demoJson?: string | null,
): SocialProofQueryResult {
  if (result.items.length > 0) return result;
  const demo = parseDemoItemsJson(demoJson);
  if (!demo.length) return result;
  return { items: demo };
}
