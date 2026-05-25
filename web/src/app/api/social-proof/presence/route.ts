import { NextResponse } from "next/server";
import { z } from "zod";
import {
  countActiveSocialProofPresence,
  pruneStaleSocialProofPresence,
  upsertSocialProofPresence,
} from "@/lib/social-proof/presence";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  sessionId: z.string().min(1).max(64),
  pathname: z.string().max(500).default("/"),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await upsertSocialProofPresence(parsed.data.sessionId, parsed.data.pathname);
    await pruneStaleSocialProofPresence();
  } catch (err) {
    console.error("[social-proof] presence upsert failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scopeRaw = url.searchParams.get("scope");
  const scope = scopeRaw === "site" ? "site" : "page";
  const pathname = url.searchParams.get("pathname") ?? "/";
  const windowMinutes = Number(url.searchParams.get("windowMinutes") ?? "5");

  try {
    const count = await countActiveSocialProofPresence({
      scope,
      pathname,
      windowMinutes,
    });
    return NextResponse.json({ count });
  } catch (err) {
    console.error("[social-proof] presence count failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ count: 0 });
  }
}
