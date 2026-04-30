/**
 * Import posts listed in https://noofox.com/post-sitemap.xml into BlogPost.
 * Downloads images under public/blog-media/{slug}/ and converts article HTML to Markdown for MDX.
 *
 * Run: npm run import:noofox-blog
 * Requires DATABASE_URL and an admin user (author); defaults to info@modempic.com.
 */

import fs from "fs/promises";
import path from "path";
import { load } from "cheerio";
import TurndownService from "turndown";
import { PrismaClient } from "@prisma/client";

const SITEMAP_URL = "https://noofox.com/post-sitemap.xml";
const SOURCE_HOST = "noofox.com";
const AUTHOR_EMAIL = process.env.IMPORT_BLOG_AUTHOR_EMAIL ?? "info@modempic.com";

const prisma = new PrismaClient();

async function fetchText(url: string, label = "GET"): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "user-agent": "ModempicBlogImport/1.0 (+https://modempic.com)",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`${label} ${url} -> ${res.status}`);
  return res.text();
}

function slugFromLoc(loc: string): string | null {
  try {
    const u = new URL(loc);
    if (u.hostname.replace(/^www\./, "") !== SOURCE_HOST) return null;
    const parts = u.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (!last || last === "blog") return null;
    return last;
  } catch {
    return null;
  }
}

async function parseSitemap(): Promise<{ loc: string; lastmod?: string }[]> {
  const xml = await fetchText(SITEMAP_URL, "sitemap");
  const $ = load(xml, { xmlMode: true });
  const out: { loc: string; lastmod?: string }[] = [];
  $("url").each((_, el) => {
    const loc = $(el).find("loc").first().text().trim();
    const lastmod = $(el).find("lastmod").first().text().trim();
    if (loc) out.push({ loc, lastmod: lastmod || undefined });
  });
  if (out.length === 0) {
    const locRe = /<loc>([^<]+)<\/loc>\s*(?:<lastmod>([^<]+)<\/lastmod>)?/gi;
    let m: RegExpExecArray | null;
    while ((m = locRe.exec(xml)) !== null) {
      out.push({ loc: m[1].trim(), lastmod: m[2]?.trim() });
    }
  }
  return out;
}

function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function downloadBinary(publicRoot: string, relativeUnderPublic: string, absoluteUrl: string): Promise<string> {
  const destAbs = path.join(publicRoot, relativeUnderPublic);
  await fs.mkdir(path.dirname(destAbs), { recursive: true });
  const res = await fetch(absoluteUrl, {
    headers: { "user-agent": "ModempicBlogImport/1.0 (+https://modempic.com)" },
  });
  if (!res.ok) throw new Error(`img ${absoluteUrl} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destAbs, buf);
  return "/" + relativeUnderPublic.replace(/\\/g, "/");
}

function extFromUrl(u: string): string {
  try {
    const p = new URL(u).pathname.split("/").pop() ?? "";
    const ext = path.extname(p).replace(/[^.a-zA-Z0-9]/g, "");
    return ext && ext.length <= 8 ? ext : ".jpg";
  } catch {
    return ".jpg";
  }
}

/**
 * WP exports often keep old staging hosts in img/src (e.g. noofoxxx.local). Same uploads path usually exists on production.
 */
function canonicalMediaFetchUrl(raw: string, baseForRelative: string): string {
  let u: URL;
  try {
    u = raw.startsWith("//") ? new URL(`https:${raw}`) : new URL(raw, baseForRelative);
  } catch {
    return raw;
  }
  const pathLower = u.pathname.toLowerCase();
  const looksLikeWpAsset = pathLower.includes("/wp-content/") || pathLower.includes("/wp-includes/");
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  const prodHost = SOURCE_HOST.replace(/^www\./, "").toLowerCase();

  const brokenStaging =
    host.includes("noofoxxx") ||
    host === "noofox.local" ||
    host === "localhost" ||
    (host.endsWith(".local") && looksLikeWpAsset);

  if (brokenStaging || (looksLikeWpAsset && host !== prodHost && !host.includes("wp.com"))) {
    return `https://${SOURCE_HOST}${u.pathname}${u.search}`;
  }
  return u.href;
}

async function localizeArticleImages(
  $article: ReturnType<typeof load>,
  pageUrl: string,
  slug: string,
  publicRoot: string,
): Promise<void> {
  let idx = 0;
  const imgs = $article("img").toArray();
  for (const el of imgs) {
    const $img = $article(el);
    const src = $img.attr("src") ?? $img.attr("data-src");
    if (!src || src.startsWith("data:")) continue;
    try {
      const absoluteRaw = new URL(src, pageUrl).href;
      const absolute = canonicalMediaFetchUrl(absoluteRaw, pageUrl);
      if (!absolute.includes("wp-content") && !absolute.includes("wp-includes") && !absolute.includes(SOURCE_HOST)) {
        continue;
      }
      const ext = extFromUrl(absolute);
      const fname = `img-${idx}${ext}`;
      idx += 1;
      const rel = path.join("blog-media", slug, fname).replace(/\\/g, "/");
      const webPath = await downloadBinary(publicRoot, rel, absolute);
      $img.attr("src", webPath);
      $img.removeAttr("srcset");
    } catch (e) {
      console.warn(`  [img] skip (${src.slice(0, 60)}…):`, e instanceof Error ? e.message : e);
    }
  }
}

function stripNoiseFromArticle($wrap: ReturnType<typeof load>) {
  $wrap.find(".sharedaddy, .yarpp-related-posts, .wprm-call-to-action, script, style, noscript, iframe, svg").remove();
}

function rewriteInternalLinks(html: string, slugSet: Set<string>): string {
  return html.replace(/href=(["'])(https?:\/\/(?:www\.)?noofox\.com\/([^"'#?]*))\1/gi, (_m, q, fullUrl, pathPart) => {
    const segments = String(pathPart).split("/").filter(Boolean);
    const s = segments[segments.length - 1];
    if (s && slugSet.has(s)) return `href=${q}/blog/${s}${q}`;
    return `href=${q}${fullUrl}${q}`;
  });
}

function rewriteMarkdownInternalLinks(md: string, slugSet: Set<string>): string {
  return md.replace(/\]\((https?:\/\/(?:www\.)?noofox\.com\/([^)/?#]+)\/?)\)/gi, (full, _url, pathRaw) => {
    const segments = String(pathRaw).split("/").filter(Boolean);
    const s = segments[segments.length - 1];
    if (s && slugSet.has(s)) return `](/blog/${s})`;
    return full;
  });
}

async function importPost(
  loc: string,
  lastmod: string | undefined,
  slugSet: Set<string>,
  authorId: string,
  publicRoot: string,
  turndown: InstanceType<typeof TurndownService>,
) {
  const slug = slugFromLoc(loc);
  if (!slug) {
    console.warn("skip (no slug)", loc);
    return;
  }

  console.log("→", slug);
  const html = await fetchText(loc, "post");

  const $page = load(html);

  const title =
    $page("h1.entry-title").first().text().trim() ||
    $page("article h1").first().text().trim() ||
    $page('meta[property="og:title"]').attr("content")?.trim() ||
    slug;

  let $content = $page(".entry-content").first();
  if (!$content.length) $content = $page("article .post-content").first();
  if (!$content.length) $content = $page(".post-entry").first();
  if (!$content.length) $content = $page("article").first();

  if (!$content.length) {
    console.warn("  skip: no article body found");
    return;
  }

  const $frag = load("<div></div>");
  $frag("div").append($content.clone());

  stripNoiseFromArticle($frag("div"));
  let innerHtml = $frag("div").html() ?? "";
  innerHtml = rewriteInternalLinks(innerHtml, slugSet);

  const $local = load(`<div id="root">${innerHtml}</div>`);
  await localizeArticleImages($local, loc, slug, publicRoot);
  innerHtml = $local("#root").html() ?? "";

  let markdown = turndown.turndown(innerHtml).trim();
  markdown = rewriteMarkdownInternalLinks(markdown, slugSet);

  const excerpt =
    $page('meta[name="description"]').attr("content")?.trim() ||
    $page('meta[property="og:description"]').attr("content")?.trim() ||
    `${markdown.replace(/^#+\s+/gm, "").slice(0, 280).trim()}${markdown.length > 280 ? "…" : ""}`;

  const category =
    $page(".cat-links a").first().text().trim() ||
    $page("article .meta-category a").first().text().trim() ||
    null;

  const authorName =
    $page(".author.vcard a").first().text().trim() ||
    $page(".entry-author-name").first().text().trim() ||
    $page('meta[name="author"]').attr("content")?.trim() ||
    null;

  const hero =
    $page('meta[property="og:image"]').attr("content")?.trim() ||
    $page('meta[name="twitter:image"]').attr("content")?.trim() ||
    null;

  let heroImageUrl: string | null = null;
  if (hero) {
    try {
      const absoluteRaw = new URL(hero, loc).href;
      const absolute = canonicalMediaFetchUrl(absoluteRaw, loc);
      const ext = extFromUrl(absolute);
      const rel = path.join("blog-media", slug, `hero${ext}`).replace(/\\/g, "/");
      heroImageUrl = await downloadBinary(publicRoot, rel, absolute);
    } catch (e) {
      console.warn("  [hero] failed:", e instanceof Error ? e.message : e);
    }
  }

  let publishedAt: Date | null = null;
  const iso =
    $page("time.entry-date").attr("datetime")?.trim() ||
    $page("time.updated").attr("datetime")?.trim() ||
    lastmod;
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) publishedAt = d;
  }

  const yoastMinutes = $page(".yoast-reading-time").first().text().match(/(\d+)\s*min/i);
  const yoastParsed = yoastMinutes ? Number.parseInt(yoastMinutes[1], 10) : NaN;
  const readMinutes =
    Number.isFinite(yoastParsed) && yoastParsed > 0 ? yoastParsed : estimateReadMinutes(markdown);

  const metaLine = [category, authorName, readMinutes ? `${readMinutes} min read` : null].filter(Boolean).join(" · ");

  const preamble = metaLine ? `> ${metaLine}\n\n` : "";
  const mdx = `${preamble}${markdown}`;

  await prisma.blogPost.upsert({
    where: { slug },
    create: {
      slug,
      title,
      excerpt,
      mdx,
      category,
      heroImageUrl,
      readMinutes,
      status: "PUBLISHED",
      authorId,
      seoTitle: title,
      seoDesc: excerpt?.slice(0, 160),
      publishedAt: publishedAt ?? new Date(),
    },
    update: {
      title,
      excerpt,
      mdx,
      category,
      heroImageUrl,
      readMinutes,
      status: "PUBLISHED",
      seoTitle: title,
      seoDesc: excerpt?.slice(0, 160),
      publishedAt: publishedAt ?? undefined,
    },
  });

  console.log("  ok", title.slice(0, 56));
}

async function main() {
  const publicRoot = path.join(process.cwd(), "public");
  const entries = await parseSitemap();
  const postUrls = entries.filter((e) => slugFromLoc(e.loc));
  const slugSet = new Set(postUrls.map((e) => slugFromLoc(e.loc)!).filter(Boolean));

  const author = await prisma.user.findFirst({
    where: { email: AUTHOR_EMAIL },
    select: { id: true },
  });
  if (!author) {
    throw new Error(`No user with email ${AUTHOR_EMAIL}. Set IMPORT_BLOG_AUTHOR_EMAIL or seed admin.`);
  }

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  turndown.remove(["script", "style", "noscript", "iframe"]);

  for (const { loc, lastmod } of postUrls) {
    try {
      await importPost(loc, lastmod, slugSet, author.id, publicRoot, turndown);
    } catch (e) {
      console.error("FAIL", loc, e);
    }
  }

  console.log("Done.", postUrls.length, "URLs processed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
