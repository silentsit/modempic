import { NextRequest, NextResponse } from "next/server";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { sendOrderPaidEmail } from "@/lib/email/send";
import { orderPaymentCompletionPlan } from "@/lib/domain/order-completion";

/**
 * Webhook for crypto payment providers. Expects JSON:
 * { "externalId": "...", "status": "succeeded" | "failed" }
 * Header X-Signature: HMAC-SHA256 of raw body with CRYPTO_WEBHOOK_SECRET
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const bodyHash = createHash("sha256").update(raw).digest("hex");
  const secret = process.env.CRYPTO_WEBHOOK_SECRET;
  const sig = req.headers.get("x-signature");
  if (!secret || !sig) {
    await prisma.webhookEvent.create({
      data: { provider: "crypto", bodyHash, signatureOk: false, error: "missing secret or signature" },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const ok = expected.length === sig.length && timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"));
  if (!ok) {
    await prisma.webhookEvent.create({
      data: { provider: "crypto", bodyHash, signatureOk: false, error: "bad signature" },
    });
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  let payload: { externalId?: string; status?: string };
  try {
    payload = JSON.parse(raw) as { externalId?: string; status?: string };
  } catch {
    await prisma.webhookEvent.create({
      data: { provider: "crypto", bodyHash, signatureOk: true, error: "invalid json" },
    });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.externalId) {
    return NextResponse.json({ error: "externalId required" }, { status: 400 });
  }

  const idem = `wh_${bodyHash}`;

  const existing = await prisma.webhookEvent.findFirst({ where: { bodyHash, processed: true } });
  if (existing) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  const payment = await prisma.payment.findFirst({ where: { externalId: payload.externalId } });
  if (!payment) {
    await prisma.webhookEvent.create({
      data: { provider: "crypto", bodyHash, signatureOk: true, error: "payment not found" },
    });
    return NextResponse.json({ error: "Unknown payment" }, { status: 404 });
  }

  try {
    if (payload.status === "succeeded" || payload.status === "paid") {
      const order = await prisma.order.findUniqueOrThrow({
        where: { id: payment.orderId },
        select: { id: true, userId: true, orderNumber: true, completedAt: true, couponId: true },
      });
      const completion = orderPaymentCompletionPlan(order.completedAt, order.couponId);
      await prisma.$transaction([
        prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.SUCCEEDED } }),
        prisma.order.update({
          where: { id: order.id },
          data: completion.orderData,
        }),
        prisma.paymentEvent.create({
          data: { paymentId: payment.id, type: "WEBHOOK_SUCCEEDED", idempotencyKey: idem, payload: { raw: bodyHash } },
        }),
        prisma.webhookEvent.create({
          data: { provider: "crypto", bodyHash, signatureOk: true, processed: true },
        }),
        ...(completion.shouldIncrementCoupon && completion.couponId
          ? [
              prisma.coupon.update({
                where: { id: completion.couponId },
                data: { redemptionCount: { increment: 1 } },
              }),
            ]
          : []),
      ]);
      if (completion.shouldSendPaidEmail) {
        const user = await prisma.user.findUniqueOrThrow({ where: { id: order.userId } });
        if (user.email) await sendOrderPaidEmail(user.email, order.orderNumber);
      }
    } else if (payload.status === "failed" || payload.status === "expired") {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: payload.status === "expired" ? PaymentStatus.EXPIRED : PaymentStatus.FAILED },
        }),
        prisma.order.update({ where: { id: payment.orderId }, data: { status: OrderStatus.FAILED } }),
        prisma.paymentEvent.create({
          data: { paymentId: payment.id, type: "WEBHOOK_FAILED", idempotencyKey: idem, payload: { raw: bodyHash } },
        }),
        prisma.webhookEvent.create({
          data: { provider: "crypto", bodyHash, signatureOk: true, processed: true },
        }),
      ]);
    } else {
      await prisma.webhookEvent.create({
        data: { provider: "crypto", bodyHash, signatureOk: true, error: "unknown status" },
      });
    }
  } catch (e) {
    await prisma.webhookEvent.create({
      data: { provider: "crypto", bodyHash, signatureOk: true, error: String(e) },
    });
    return NextResponse.json({ error: "Process failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
