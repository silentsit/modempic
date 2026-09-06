import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { revalidateStorefrontForBlog } from "@/lib/storefront-revalidate";

function revalidateSecret(): string | undefined {
  return process.env.REVALIDATE_SECRET?.trim() || process.env.CRON_SECRET?.trim() || undefined;
}

/** On-demand ISR refresh after CLI MDX publish (scripts/update-*-post.ts). */
export async function POST(req: Request) {
  const secret = revalidateSecret();
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: { slug?: string; legacySlug?: string };
  try {
    body = (await req.json()) as { slug?: string; legacySlug?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });
  }

  revalidateStorefrontForBlog(slug);
  const legacySlug = body.legacySlug?.trim();
  if (legacySlug) revalidatePath(`/blog/${legacySlug}`);

  return NextResponse.json({ ok: true, slug, legacySlug: legacySlug ?? null });
}
