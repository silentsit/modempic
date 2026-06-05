import { NextResponse } from "next/server";
import { loadSocialProofBootstrapOrNull } from "@/lib/social-proof/bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  const bootstrap = await loadSocialProofBootstrapOrNull();
  if (!bootstrap) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(bootstrap, {
    headers: {
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
    },
  });
}
