import { NextResponse } from "next/server";

/** IndexNow key verification — keyLocation for submit payloads. */
export async function GET() {
  const key = process.env.INDEXNOW_API_KEY?.trim();
  if (!key) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return new NextResponse(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
