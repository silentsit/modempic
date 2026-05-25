import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { composeSocialProofMessage } from "./compose-notification";

export type SocialProofFeedEvent = {
  id: string;
  orderNumber: string;
  type: "order.completed";
  completedAtIso: string;
  displayName: string;
  email: string | null;
  locationLine: string | null;
  productName: string | null;
  productSlug: string | null;
  totalCents: number;
  currency: string;
};

const MAX_WINDOW_DAYS = 30;
const MAX_PAGE_SIZE = 50;

function clampWindowDays(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 7;
  return Math.min(Math.floor(n), MAX_WINDOW_DAYS);
}

function clampPage(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function clampPageSize(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 25;
  return Math.min(Math.floor(n), MAX_PAGE_SIZE);
}

function daysAgo(d: Date, days: number): Date {
  const t = new Date(d);
  t.setUTCDate(t.getUTCDate() - days);
  return t;
}

export async function fetchSocialProofEventsFeed(options: {
  windowDays?: number;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<{ events: SocialProofFeedEvent[]; total: number; page: number; pageSize: number }> {
  const now = new Date();
  const windowDays = clampWindowDays(options.windowDays ?? 7);
  const page = clampPage(options.page ?? 1);
  const pageSize = clampPageSize(options.pageSize ?? 25);
  const since = daysAgo(now, windowDays);
  const search = options.search?.trim() ?? "";

  const where = {
    status: OrderStatus.COMPLETED,
    completedAt: { gte: since, not: null },
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" as const } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
            { user: { name: { contains: search, mode: "insensitive" as const } } },
            { shippingAddress: { city: { contains: search, mode: "insensitive" as const } } },
            { lines: { some: { title: { contains: search, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { completedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        completedAt: true,
        totalCents: true,
        currency: true,
        user: { select: { email: true, name: true } },
        shippingAddress: {
          select: { fullName: true, city: true, state: true, country: true },
        },
        lines: {
          orderBy: { id: "asc" },
          take: 1,
          select: {
            title: true,
            product: { select: { slug: true, name: true } },
          },
        },
      },
    }),
  ]);

  const events: SocialProofFeedEvent[] = [];
  for (const row of rows) {
    const at = row.completedAt;
    if (!at) continue;
    const composed = composeSocialProofMessage({
      shippingFullName: row.shippingAddress?.fullName ?? null,
      userName: row.user?.name ?? null,
      city: row.shippingAddress?.city ?? null,
      state: row.shippingAddress?.state ?? null,
      country: row.shippingAddress?.country ?? null,
      primaryLineTitle: row.lines[0]?.title ?? null,
    });
    const product = row.lines[0]?.product;
    events.push({
      id: row.id,
      orderNumber: row.orderNumber,
      type: "order.completed",
      completedAtIso: at.toISOString(),
      displayName: composed.displayName,
      email: row.user?.email ?? null,
      locationLine: composed.locationLine ?? null,
      productName: product?.name ?? row.lines[0]?.title ?? null,
      productSlug: product?.slug ?? null,
      totalCents: row.totalCents,
      currency: row.currency,
    });
  }

  return { events, total, page, pageSize };
}

/** Summary counts for admin dashboard cards. */
export async function fetchSocialProofEventsSummary(windowDays = 7): Promise<{
  completedOrders: number;
  uniqueCustomers: number;
}> {
  const since = daysAgo(new Date(), clampWindowDays(windowDays));
  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.COMPLETED,
      completedAt: { gte: since, not: null },
    },
    select: { userId: true },
  });
  const uniqueCustomers = new Set(orders.map((o) => o.userId)).size;
  return { completedOrders: orders.length, uniqueCustomers };
}
