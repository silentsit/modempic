import { OrderStatus, ProductStatus, ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";

const emptyKpis = {
  totalSalesCents: 0,
  netSalesCents: 0,
  orderCount: 0,
  allOrders: 0,
  aovCents: 0,
  itemsSold: 0,
};

export async function getAdminKpis() {
  return prismaDevOr("getAdminKpis", async () => {
    const [paid, count, lines] = await Promise.all([
      prisma.order.aggregate({
        where: { status: OrderStatus.PAID },
        _sum: { totalCents: true, discountCents: true, taxCents: true, shippingCents: true },
        _count: { id: true },
      }),
      prisma.order.count(),
      prisma.orderLine.aggregate({
        where: { order: { status: OrderStatus.PAID } },
        _sum: { quantity: true },
      }),
    ]);
    const gross = paid._sum.totalCents ?? 0;
    const orders = paid._count.id;
    const aov = orders > 0 ? Math.round(gross / orders) : 0;
    return {
      totalSalesCents: gross,
      netSalesCents: Math.max(0, gross - (paid._sum.discountCents ?? 0)),
      orderCount: orders,
      allOrders: count,
      aovCents: aov,
      itemsSold: lines._sum.quantity ?? 0,
    };
  }, emptyKpis);
}

export async function revenueByDayLast30() {
  return prismaDevOr("revenueByDayLast30", async () => {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const orders = await prisma.order.findMany({
      where: { status: OrderStatus.PAID, createdAt: { gte: start } },
      select: { createdAt: true, totalCents: true },
    });
    const map = new Map<string, { revenue: number; orders: number }>();
    for (const o of orders) {
      const d = o.createdAt.toISOString().slice(0, 10);
      const cur = map.get(d) ?? { revenue: 0, orders: 0 };
      cur.revenue += o.totalCents;
      cur.orders += 1;
      map.set(d, cur);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, revenueCents: v.revenue, orders: v.orders }));
  }, []);
}

export async function topProducts() {
  return prismaDevOr("topProducts", async () => {
    const lines = await prisma.orderLine.findMany({
      where: { order: { status: OrderStatus.PAID } },
      include: { product: { select: { name: true, slug: true } } },
    });
    const map = new Map<string, { name: string; slug: string; qty: number; rev: number }>();
    for (const l of lines) {
      const k = l.productId;
      const cur = map.get(k) ?? { name: l.product.name, slug: l.product.slug, qty: 0, rev: 0 };
      cur.qty += l.quantity;
      cur.rev += l.lineTotalCents;
      map.set(k, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 10);
  }, []);
}

export async function topCategories() {
  return prismaDevOr("topCategories", async () => {
    const lines = await prisma.orderLine.findMany({
      where: { order: { status: OrderStatus.PAID } },
      include: { product: { include: { categories: { include: { category: true } } } } },
    });
    const map = new Map<string, { name: string; rev: number }>();
    for (const l of lines) {
      for (const pc of l.product.categories) {
        const k = pc.categoryId;
        const cur = map.get(k) ?? { name: pc.category.name, rev: 0 };
        cur.rev += l.lineTotalCents;
        map.set(k, cur);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 8);
  }, []);
}

export async function getRecentOrders(take = 8) {
  return prismaDevOr("getRecentOrders", async () => {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: {
        user: { select: { name: true, email: true } },
        lines: { select: { quantity: true } },
      },
    });
    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalCents: o.totalCents,
      currency: o.currency,
      createdAt: o.createdAt,
      customerName: o.user?.name ?? null,
      customerEmail: o.user?.email ?? null,
      itemCount: o.lines.reduce((sum, l) => sum + l.quantity, 0),
    }));
  }, [] as Array<{
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalCents: number;
    currency: string;
    createdAt: Date;
    customerName: string | null;
    customerEmail: string | null;
    itemCount: number;
  }>);
}

export async function getActivitySummary() {
  return prismaDevOr("getActivitySummary", async () => {
    const [pendingOrders, pendingReviews, pendingContacts, draftProducts, openCarts] = await Promise.all([
      prisma.order.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
      prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
      prisma.contactSubmission.count({ where: { handled: false } }),
      prisma.product.count({ where: { status: ProductStatus.DRAFT } }),
      prisma.cart.count({ where: { items: { some: {} } } }),
    ]);
    return { pendingOrders, pendingReviews, pendingContacts, draftProducts, openCarts };
  }, { pendingOrders: 0, pendingReviews: 0, pendingContacts: 0, draftProducts: 0, openCarts: 0 });
}
