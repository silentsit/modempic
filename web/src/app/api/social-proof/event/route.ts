import { NextResponse } from "next/server";
import { z } from "zod";
import { loadSocialProofStore } from "@/lib/social-proof/config";
import { socialProofEventTypeSchema } from "@/lib/social-proof/analytics-schema";
import { recordSocialProofAnalyticsEvent } from "@/lib/social-proof/analytics-store";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  notificationId: z.string().min(1).max(64),
  event: socialProofEventTypeSchema,
  pathname: z.string().max(500).optional(),
  slideKey: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const store = await loadSocialProofStore();
  const exists = store.notifications.some((n) => n.id === parsed.data.notificationId);
  if (!exists) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    await recordSocialProofAnalyticsEvent(parsed.data.notificationId, parsed.data.event);
  } catch (err) {
    console.error("[social-proof] event record failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
