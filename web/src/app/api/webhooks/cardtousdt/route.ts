import { NextResponse } from "next/server";
import { processCardToUsdtWebhook } from "@/lib/payments/cardtousdt";

export const dynamic = "force-dynamic";

/**
 * CardToUSDT calls this URL exactly as given, including the query string.
 * Do not redirect. Fields live on the query — read the query, not a POST body.
 * GET is first; a 405 here makes them retry POST to the same URL.
 */
async function handle(req: Request) {
  try {
    const result = await processCardToUsdtWebhook(req);
    if (result.status === 200) {
      return new NextResponse("ok", { status: 200 });
    }
    return new NextResponse(result.message, { status: result.status });
  } catch (error) {
    console.error("[cardtousdt] webhook failed", error);
    return new NextResponse("internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
