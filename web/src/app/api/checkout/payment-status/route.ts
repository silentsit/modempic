import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { loadAccessibleCheckoutOrder } from "@/lib/checkout/checkout-order-access";
import { isReusableGatewayUrl } from "@/lib/checkout/checkout-payment-sessions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const orderNumber = new URL(req.url).searchParams.get("order")?.trim() ?? "";
  if (!orderNumber) {
    return NextResponse.json({ ok: false, error: "Missing order number." }, { status: 400 });
  }

  const order = await loadAccessibleCheckoutOrder(orderNumber);
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  const pay = order.payments[0] ?? null;
  return NextResponse.json({
    ok: true,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    paymentStatus: pay?.status ?? null,
    provider: pay?.provider ?? null,
    payAddress: isReusableGatewayUrl(pay?.payAddress, pay?.expiresAt) ? pay?.payAddress : null,
    paid: pay?.status === PaymentStatus.SUCCEEDED,
  });
}
