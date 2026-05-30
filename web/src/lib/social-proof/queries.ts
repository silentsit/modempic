import { OrderStatus, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { composeSocialProofMessage, type ComposeParams } from "./compose-notification";
import { formatTimeAgo } from "./format-time-ago";

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
  /** Pre-formatted relative time for card footer. */
  timeLabel?: string;
  /** Internal: generated when no real orders exist (stripped from public API). */
  synthetic?: boolean;
};

export type SocialProofQueryResult = {
  items: SocialProofActivityItemDto[];
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

export async function fetchRecentSocialProofActivity(options: {
  now?: Date;
  windowDays?: number;
  take?: number;
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
              status: true,
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
    const line = row.lines[0];
    const product = line?.product;
    const publishedProduct =
      product?.status === ProductStatus.PUBLISHED && product.name?.trim() ? product : null;
    const lineTitle = line?.title?.trim() || null;
    const compose: ComposeParams = {
      shippingFullName: row.shippingAddress?.fullName ?? null,
      userName: row.user?.name ?? null,
      city: row.shippingAddress?.city ?? null,
      state: row.shippingAddress?.state ?? null,
      country: row.shippingAddress?.country ?? null,
      primaryLineTitle: publishedProduct?.name ?? lineTitle,
    };
    const composed = composeSocialProofMessage(compose);
    const imageUrl = publishedProduct?.images[0]?.url;
    items.push({
      message: composed.message,
      completedAtIso: at.toISOString(),
      timeLabel: formatTimeAgo(at, now),
      displayName: composed.displayName,
      actionLine: composed.actionLine,
      locationLine: composed.locationLine,
      ...(composed.productHint ? { productHint: composed.productHint } : {}),
      ...(publishedProduct?.slug ? { productSlug: publishedProduct.slug } : {}),
      ...(imageUrl ? { productImageUrl: imageUrl } : {}),
    });
  }

  return { items };
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
