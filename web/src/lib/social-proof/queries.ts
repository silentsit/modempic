import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { composeSocialProofMessage, type ComposeParams } from "./compose-notification";

export type SocialProofActivityItemDto = {
  message: string;
  completedAtIso: string;
  productHint?: string;
  productSlug?: string;
  productImageUrl?: string;
  /** TrustPulse-style bold headline (first name / safe handle). */
  displayName: string;
  /** Subline under the name. */
  actionLine: string;
  /** Optional geography (city, state). */
  locationLine?: string | null;
  /** Internal: generated when no real orders exist (stripped from public API). */
  synthetic?: boolean;
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
        select: {
          title: true,
          product: {
            select: {
              slug: true,
              name: true,
              images: {
                orderBy: { sortOrder: "asc" },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
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
    const composed = composeSocialProofMessage(compose);
    const product = row.lines[0]?.product;
    const imageUrl = product?.images[0]?.url;
    items.push({
      message: composed.message,
      completedAtIso: at.toISOString(),
      displayName: composed.displayName,
      actionLine: composed.actionLine,
      locationLine: composed.locationLine,
      ...(composed.productHint ? { productHint: composed.productHint } : {}),
      ...(product?.slug ? { productSlug: product.slug } : {}),
      ...(imageUrl ? { productImageUrl: imageUrl } : {}),
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

function normalizeDemoDto(
  message: string,
  iso: string,
  productHint?: string,
  displayName?: string,
  actionLine?: string,
  locationLine?: string | null,
): SocialProofActivityItemDto {
  if (displayName?.trim() && actionLine?.trim()) {
    return {
      message,
      completedAtIso: iso,
      displayName: displayName.trim(),
      actionLine: actionLine.trim(),
      locationLine: locationLine ?? null,
      ...(productHint ? { productHint } : {}),
    };
  }
  const fromIdx = message.indexOf(" from ");
  if (fromIdx > 0) {
    const dn = message.slice(0, fromIdx).trim();
    const rest = message.slice(fromIdx + " from ".length).trim();
    const justIdx = rest.search(/\sjust\s/i);
    const purIdx = rest.search(/\spurchased\s/i);
    const cut = justIdx >= 0 ? justIdx : purIdx >= 0 ? purIdx : -1;
    const loc = cut >= 0 ? rest.slice(0, cut).trim() : null;
    const act = cut >= 0 ? rest.slice(cut).trim() : rest;
    return {
      message,
      completedAtIso: iso,
      displayName: dn || "Someone",
      actionLine: act.replace(/^just\s/i, "Just ").replace(/^purchased/i, "Purchased") || message,
      locationLine: loc,
      ...(productHint ? { productHint } : {}),
    };
  }
  const justIdx = message.indexOf(" just ");
  if (justIdx > 0) {
    return {
      message,
      completedAtIso: iso,
      displayName: message.slice(0, justIdx).trim() || "Someone",
      actionLine: message.slice(justIdx + " just ".length).trim(),
      locationLine: null,
      ...(productHint ? { productHint } : {}),
    };
  }
  const purIdx = message.indexOf(" purchased ");
  if (purIdx > 0) {
    return {
      message,
      completedAtIso: iso,
      displayName: message.slice(0, purIdx).trim() || "Someone",
      actionLine: message.slice(purIdx + " purchased ".length).trim(),
      locationLine: null,
      ...(productHint ? { productHint } : {}),
    };
  }
  return {
    message,
    completedAtIso: iso,
    displayName: "Someone",
    actionLine: message,
    locationLine: null,
    ...(productHint ? { productHint } : {}),
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
      const productHint =
        typeof o.productHint === "string" && o.productHint.trim() ? o.productHint.trim() : undefined;
      const displayName = typeof o.displayName === "string" ? o.displayName.trim() : undefined;
      const actionLine = typeof o.actionLine === "string" ? o.actionLine.trim() : undefined;
      const locationLine =
        typeof o.locationLine === "string"
          ? o.locationLine.trim()
          : o.locationLine === null
            ? null
            : undefined;
      out.push(
        normalizeDemoDto(message, new Date(iso).toISOString(), productHint, displayName, actionLine, locationLine),
      );
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
