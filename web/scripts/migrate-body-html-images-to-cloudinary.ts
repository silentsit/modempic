/**
 * Recover product description images that still point at dead NooFox hosts
 * (noofoxxx.local / noofox.com 530) via the Wayback Machine, upload to Cloudinary,
 * and rewrite Product.bodyHtml.
 *
 * From web/:
 *   npx tsx scripts/migrate-body-html-images-to-cloudinary.ts
 *   npx tsx scripts/migrate-body-html-images-to-cloudinary.ts --apply
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { PrismaClient } from "@prisma/client";
import { rewriteProductBodyImageHtml } from "../src/lib/product-html";
import { configureCloudinaryFromEnv, uploadImageBufferToCloudinary } from "./cloudinary-upload";

function bootstrapEnvFromFiles() {
  const root = process.cwd();
  for (const name of [".env.local", ".env"]) {
    const fp = path.join(root, name);
    if (!fs.existsSync(fp)) continue;
    const txt = fs.readFileSync(fp, "utf8").replace(/^\uFEFF/, "");
    for (const rawLine of txt.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

bootstrapEnvFromFiles();

function argsHas(flag: string) {
  return process.argv.includes(flag);
}

function decodeAttr(value: string): string {
  return value.replace(/&amp;/gi, "&").trim();
}

function collectImgUrls(html: string): string[] {
  const $ = load(html);
  const urls = new Set<string>();
  $("img").each((_, el) => {
    const src = $(el).attr("src") ?? $(el).attr("data-src");
    if (src) urls.add(decodeAttr(src));
  });
  return [...urls];
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function isAlreadyHosted(url: string): boolean {
  const host = hostOf(url);
  return host === "res.cloudinary.com" || host === "koala.sh";
}

function needsRecovery(url: string): boolean {
  const host = hostOf(url);
  if (!host) return false;
  return (
    host === "noofox.com" ||
    host.includes("noofoxxx") ||
    host.endsWith(".local") ||
    host.endsWith(".kinsta.cloud") ||
    host === "on-page.ai" ||
    host.endsWith(".on-page.ai")
  );
}

function canonicalNoofoxUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.toLowerCase().includes("/wp-content/")) return null;
    return `https://noofox.com${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

function extFromUrl(url: string): string {
  try {
    const base = path.basename(new URL(url).pathname);
    const ext = path.extname(base).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(ext)) return ext;
  } catch {
    /* ignore */
  }
  return ".jpg";
}

function mimeFromExt(ext: string): string {
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".avif") return "image/avif";
  return "image/jpeg";
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBuffer(url: string): Promise<{ buf: Buffer; ctype: string } | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "ModempicImageRecovery/1.0" },
    });
    if (!res.ok) return null;
    const ctype = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!ctype.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 32) return null;
    return { buf, ctype };
  } catch {
    return null;
  }
}

function originalUploadUrl(url: string): string | null {
  const stripped = url.replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp|gif|avif)$)/i, "");
  return stripped === url ? null : stripped;
}

async function recoverBytes(url: string): Promise<{ buf: Buffer; ctype: string } | null> {
  const targets = [url];
  const canonical = canonicalNoofoxUrl(url);
  if (canonical && canonical !== url) targets.push(canonical);
  const original = originalUploadUrl(canonical ?? url);
  if (original) targets.push(original);

  for (const target of targets) {
    if (!needsRecovery(target)) {
      const live = await fetchBuffer(target);
      if (live) return live;
    }
  }

  for (const target of [...new Set(targets)]) {
    const canonicalTarget = canonicalNoofoxUrl(target) ?? target;
    for (const year of ["2024", "2025", "2023"]) {
      await sleep(400);
      const archived = await fetchBuffer(`https://web.archive.org/web/${year}id_/${canonicalTarget}`);
      if (archived) return archived;
    }
  }
  return null;
}

function applyUrlMap(html: string, urlMap: Map<string, string>): string {
  let next = html;
  const pairs = [...urlMap.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of pairs) {
    if (from === to) continue;
    next = next.split(from).join(to);
    const encoded = from.replace(/&/g, "&amp;");
    if (encoded !== from) next = next.split(encoded).join(to);
  }
  return rewriteProductBodyImageHtml(next);
}

function extractWxrProductImages(xml: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const item of xml.split("<item>")) {
    if (!item.includes("<wp:post_type><![CDATA[product]]></wp:post_type>")) continue;
    const name = /<wp:post_name><!\[CDATA\[([^\]]+)\]\]>/.exec(item)?.[1];
    const content = /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/.exec(item)?.[1];
    if (!name || !content) continue;
    const srcs = [...content.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map((m) => decodeAttr(m[1]));
    if (srcs.length) map.set(name, [...new Set(srcs)]);
  }
  return map;
}

function insertImagesAfterFirstHeading(html: string, urls: string[]): string {
  const block = urls.map((url) => `<p><img src="${url}" alt="" loading="lazy" decoding="async"></p>`).join("\n");
  if (/<\/h2>/i.test(html)) return html.replace(/<\/h2>/i, `</h2>\n${block}`);
  return `${block}\n${html}`;
}

async function main() {
  const apply = argsHas("--apply");
  if (!apply) console.log("Dry run. Pass --apply to upload and update Product.bodyHtml.");

  configureCloudinaryFromEnv();
  const prisma = new PrismaClient();
  const urlMap = new Map<string, string>();
  let recovered = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const products = await prisma.product.findMany({
      where: { bodyHtml: { not: null } },
      select: { id: true, slug: true, bodyHtml: true },
      orderBy: { slug: "asc" },
    });

    const unique = new Set<string>();
    for (const product of products) {
      if (!product.bodyHtml) continue;
      for (const url of collectImgUrls(product.bodyHtml)) unique.add(url);
    }

    for (const url of unique) {
      if (isAlreadyHosted(url)) {
        urlMap.set(url, url);
        skipped += 1;
        continue;
      }

      process.stdout.write(`recover ${url.slice(0, 90)}… `);
      const got = await recoverBytes(url);
      if (!got) {
        console.log("FAIL");
        failed += 1;
        continue;
      }
      if (!apply) {
        console.log(`ok ${got.buf.length} bytes (dry)`);
        urlMap.set(url, `https://res.cloudinary.com/dry/${crypto.createHash("sha256").update(url).digest("hex").slice(0, 12)}`);
        recovered += 1;
        continue;
      }
      const ext = extFromUrl(url);
      const hash = crypto.createHash("sha256").update(url).digest("hex").slice(0, 16);
      const publicIdPath = `body/${hash}`;
      const secureUrl = await uploadImageBufferToCloudinary({
        buffer: got.buf,
        contentType: got.ctype || mimeFromExt(ext),
        publicIdPath,
      });
      urlMap.set(url, secureUrl);
      recovered += 1;
      console.log(`→ ${secureUrl.slice(0, 72)}…`);
    }

    let productsUpdated = 0;
    for (const product of products) {
      if (!product.bodyHtml) continue;
      const next = applyUrlMap(product.bodyHtml, urlMap);
      if (next === product.bodyHtml) continue;
      productsUpdated += 1;
      if (!apply) {
        console.log(`[dry] would update ${product.slug}`);
        continue;
      }
      await prisma.product.update({
        where: { id: product.id },
        data: { bodyHtml: next },
      });
      console.log(`[apply] ${product.slug}`);
    }

    console.log(
      `${apply ? "Done" : "Dry run"}. unique urls ${unique.size}, recovered ${recovered}, reused ${skipped}, failed ${failed}, products ${productsUpdated}.`,
    );

    const wxrPath = path.resolve(process.cwd(), "..", "noofox.WordPress.2026-05-01.xml");
    if (!fs.existsSync(wxrPath)) {
      console.log("No WXR export found; skipped restoring stripped description images.");
      return;
    }
    const wxrImages = extractWxrProductImages(fs.readFileSync(wxrPath, "utf8"));
    const refreshed = await prisma.product.findMany({
      where: { bodyHtml: { not: null } },
      select: { id: true, slug: true, bodyHtml: true },
    });
    for (const product of refreshed) {
      const current = collectImgUrls(rewriteProductBodyImageHtml(product.bodyHtml ?? ""));
      if (current.length > 0) continue;
      const srcs = wxrImages.get(product.slug);
      if (!srcs?.length) continue;
      const hosted: string[] = [];
      for (const src of srcs) {
        process.stdout.write(`restore ${product.slug} ${src.slice(0, 70)}… `);
        const got = await recoverBytes(src);
        if (!got) {
          console.log("FAIL");
          continue;
        }
        if (!apply) {
          hosted.push(`https://res.cloudinary.com/dry/${crypto.createHash("sha256").update(src).digest("hex").slice(0, 12)}`);
          console.log("ok (dry)");
          continue;
        }
        const ext = extFromUrl(src);
        const hash = crypto.createHash("sha256").update(src).digest("hex").slice(0, 16);
        const secureUrl = await uploadImageBufferToCloudinary({
          buffer: got.buf,
          contentType: got.ctype || mimeFromExt(ext),
          publicIdPath: `body/${hash}`,
        });
        hosted.push(secureUrl);
        console.log(`→ ${secureUrl.slice(0, 72)}…`);
      }
      if (!hosted.length || !product.bodyHtml) continue;
      const next = insertImagesAfterFirstHeading(product.bodyHtml, hosted);
      if (!apply) {
        console.log(`[dry] would restore ${hosted.length} images on ${product.slug}`);
        continue;
      }
      await prisma.product.update({ where: { id: product.id }, data: { bodyHtml: next } });
      console.log(`[restore] ${product.slug} +${hosted.length}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
