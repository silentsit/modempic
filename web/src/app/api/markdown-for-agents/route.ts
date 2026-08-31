import { NextRequest, NextResponse } from "next/server";
import { CONTENT_SIGNAL } from "@/lib/seo/robots-txt";
import { estimateMarkdownTokens, htmlToMarkdown } from "@/lib/agent-markdown/html-to-markdown";
import { MARKDOWN_BYPASS_HEADER, MARKDOWN_SOURCE_PATH_HEADER, safeMarkdownSourcePath } from "@/lib/agent-markdown/negotiate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const path = safeMarkdownSourcePath(
    req.headers.get(MARKDOWN_SOURCE_PATH_HEADER) ?? req.nextUrl.searchParams.get("path"),
  );
  if (!path) {
    return new NextResponse("Not found", { status: 404 });
  }

  const target = new URL(path, req.nextUrl.origin);
  const htmlRes = await fetch(target, {
    headers: {
      Accept: "text/html",
      [MARKDOWN_BYPASS_HEADER]: "1",
      cookie: req.headers.get("cookie") ?? "",
    },
    redirect: "manual",
  });

  if (htmlRes.status >= 300 && htmlRes.status < 400) {
    const location = htmlRes.headers.get("location");
    const res = new NextResponse(null, { status: htmlRes.status });
    if (location) res.headers.set("Location", location);
    res.headers.set("Vary", "Accept");
    return res;
  }

  if (!htmlRes.ok) {
    return new NextResponse(null, { status: htmlRes.status });
  }

  const html = await htmlRes.text();
  const markdown = htmlToMarkdown(html);
  const res = new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=60, must-revalidate",
      Vary: "Accept",
      "x-markdown-tokens": String(estimateMarkdownTokens(markdown)),
      "x-original-tokens": String(estimateMarkdownTokens(html)),
      "Content-Signal": CONTENT_SIGNAL,
    },
  });
  return res;
}
