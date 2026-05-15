import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/admin";
import { Prisma } from "@prisma/client";

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  await requireStaff();
  const { searchParams } = new URL(req.url);
  const s = searchParams.get("s")?.trim();
  const type = searchParams.get("type")?.trim();

  const where: Prisma.CouponWhereInput = {
    ...(s
      ? {
          OR: [
            { code: { contains: s, mode: "insensitive" } },
            { description: { contains: s, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(type === "PERCENT" || type === "FIXED" ? { type } : {}),
  };

  const rows = await prisma.coupon.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
    },
  });

  const header = [
    "code",
    "type",
    "value",
    "minOrderCents",
    "maxOrderCents",
    "redemptionCount",
    "maxRedemptions",
    "usageLimitPerUser",
    "active",
    "startsAt",
    "endsAt",
    "freeShipping",
    "excludeSaleItems",
    "allowedEmails",
    "orderCount",
  ];

  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        escapeCsvCell(r.code),
        escapeCsvCell(r.type),
        String(r.value),
        String(r.minOrderCents),
        r.maxOrderCents == null ? "" : String(r.maxOrderCents),
        String(r.redemptionCount),
        r.maxRedemptions == null ? "" : String(r.maxRedemptions),
        r.usageLimitPerUser == null ? "" : String(r.usageLimitPerUser),
        r.active ? "1" : "0",
        r.startsAt ? r.startsAt.toISOString() : "",
        r.endsAt ? r.endsAt.toISOString() : "",
        r.freeShipping ? "1" : "0",
        r.excludeSaleItems ? "1" : "0",
        escapeCsvCell(r.allowedEmails ?? ""),
        String(r._count.orders),
      ].join(","),
    ),
  ];

  const body = lines.join("\r\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="coupons-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
