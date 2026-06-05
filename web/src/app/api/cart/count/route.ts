import { NextResponse } from "next/server";
import { getCartCount } from "@/lib/data/cart";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ count: await getCartCount() });
}
