import { NextResponse } from "next/server";
import { loadAccessibleCheckoutOrder } from "@/lib/checkout/checkout-order-access";
import { mintHostedPaymentForOrder } from "@/lib/checkout/mint-hosted-payment";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let orderNumber = "";
  try {
    const body = (await req.json()) as { orderNumber?: unknown };
    orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (!orderNumber) {
    return NextResponse.json({ ok: false, error: "Missing order number." }, { status: 400 });
  }

  try {
    const order = await loadAccessibleCheckoutOrder(orderNumber);
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    }

    const result = await mintHostedPaymentForOrder(order);
    if (!result.ok) {
      return NextResponse.json(result, { status: result.alreadyPaid ? 409 : 502 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[payment-handoff]", orderNumber, error);
    return NextResponse.json(
      { ok: false, error: "Could not start payment. Try again or contact support." },
      { status: 500 },
    );
  }
}
