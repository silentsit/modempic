import { NextRequest, NextResponse } from "next/server";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { sendOrderPaidEmail } from "@/lib/email/send";
/** Partner webhook — verify with shared secret; shape depends on official Guardarian event payload. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const bodyHash = createHash("sha256").update(raw).digest("hex");
  const sig = req.headers.get("x-signature") ?? req.headers.get("x-guardarian-signature");
  const whSecret = process.env.GUARDARIAN_WEBHOOK_SECRET;
  if (!whSecret) {
    await prisma.webhookEvent.create({
      data: { provider: "guardarian", bodyHash, signatureOk: false, error: "webhook not configured" },
    });
    return NextResponse.json({ error: "Not configured" }, { status: 501 });
  }
  const expected = createHmac("sha256", whSecret).update(raw).digest("hex");
  if (!sig || expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"))) {
    await prisma.webhookEvent.create({ data: { provider: "guardarian", bodyHash, signatureOk: false } });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let p: { orderRef?: string; status?: string; orderId?: string };
  try {
    p = JSON.parse(raw) as { orderRef?: string; status?: string; orderId?: string };
  } catch {
    return NextResponse.json({ error: "JSON" }, { status: 400 });
  }
  // Adapter contract: we store partner external id; map orderRef to payment.externalId
  const ext = p.orderRef ?? p.orderId;
  if (!ext) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const payment = await prisma.payment.findFirst({ where: { provider: "guardarian", externalId: String(ext) } });
  if (!payment) {
    await prisma.webhookEvent.create({ data: { provider: "guardarian", bodyHash, signatureOk: true, error: "not found" } });
    return NextResponse.json({ error: "Unknown" }, { status: 404 });
  }
  if (p.status === "success" || p.status === "completed" || p.status === "paid") {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: payment.orderId },
      select: { id: true, userId: true, orderNumber: true, completedAt: true, couponId: true },
    });
    const idempotencyKey = `gd_${bodyHash}`;
    const completion = await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.SUCCEEDED } });
      const firstOrderCompletion = await tx.order.updateMany({
        where: { id: order.id, completedAt: null },
        data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
      });
      if (firstOrderCompletion.count === 0) {
        await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.COMPLETED } });
      }
      await tx.paymentEvent.upsert({
        where: { idempotencyKey },
        update: {},
        create: { paymentId: payment.id, type: "ONRAMP_PAID", idempotencyKey },
      });
      await tx.webhookEvent.create({ data: { provider: "guardarian", bodyHash, signatureOk: true, processed: true } });
      if (firstOrderCompletion.count > 0 && order.couponId) {
        await tx.coupon.update({
          where: { id: order.couponId },
          data: { redemptionCount: { increment: 1 } },
        });
      }
      return { shouldSendPaidEmail: firstOrderCompletion.count > 0 };
    });
    if (completion.shouldSendPaidEmail) {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: order.userId } });
      if (user.email) await sendOrderPaidEmail(user.email, order.orderNumber);
    }
  } else {
    await prisma.webhookEvent.create({ data: { provider: "guardarian", bodyHash, signatureOk: true, processed: true } });
  }
  return NextResponse.json({ ok: true });
}
