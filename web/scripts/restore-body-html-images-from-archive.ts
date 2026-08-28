/**
 * Restore product description images from a local WordPress backup zip
 * (wp-content/uploads) using the original WXR HTML, then upload to Cloudinary.
 *
 * From web/:
 *   npx tsx scripts/restore-body-html-images-from-archive.ts --zip "C:\\path\\to\\archive.zip"
 *   npx tsx scripts/restore-body-html-images-from-archive.ts --zip "C:\\path\\to\\archive.zip" --apply
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { load } from "cheerio";
import { PrismaClient } from "@prisma/client";
import { sanitizeProductBodyHtml } from "../src/lib/product-html";
import { configureCloudinaryFromEnv, uploadImageBufferToCloudinary } from "./cloudinary-upload";

const DEFAULT_ZIP =
  "c:\\Users\\user\\Downloads\\20260501_noofox_f70bb49baf7f38936209_20260501140731_archive.zip";
const DEFAULT_WXR = path.resolve(process.cwd(), "..", "noofox.WordPress.2026-05-01.xml");

type ZipHit = { name: string; base: string; stem: string; pixels: number; original: boolean };

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

function argsHas(flag: string) {
  return process.argv.includes(flag);
}

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

function decodeAttr(value: string): string {
  return value.replace(/&amp;/gi, "&").trim();
}

function extFromName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(ext)) return ext;
  return ".jpg";
}

function mimeFromExt(ext: string): string {
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".avif") return "image/avif";
  return "image/jpeg";
}

function stemOf(base: string): string {
  return base
    .replace(/-scaled(?=\.[^.]+$)/i, "")
    .replace(/-\d+x\d+(?=\.[^.]+$)/i, "")
    .toLowerCase();
}

function pixelsOf(base: string): number {
  const m = /-(\d+)x(\d+)\.[^.]+$/i.exec(base);
  if (!m) return 0;
  return Number(m[1]) * Number(m[2]);
}

function isOriginalName(base: string): boolean {
  return !/-\d+x\d+\.[^.]+$/i.test(base) && !/-scaled\.[^.]+$/i.test(base);
}

function uploadsRelFromUrl(url: string): string | null {
  try {
    const parsed = new URL(decodeAttr(url), "https://noofox.com");
    const m = /\/wp-content\/uploads\/(.+)$/i.exec(parsed.pathname);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

function collectImgUrls(html: string): string[] {
  const $ = load(html, null, false);
  const urls = new Set<string>();
  $("img").each((_, el) => {
    const src = $(el).attr("src") ?? $(el).attr("data-src");
    if (src) urls.add(decodeAttr(src));
    const srcset = $(el).attr("srcset") ?? $(el).attr("data-srcset");
    if (!srcset) return;
    for (const part of srcset.split(",")) {
      const u = decodeAttr(part.trim().split(/\s+/)[0] ?? "");
      if (u) urls.add(u);
    }
  });
  return [...urls];
}

function extractWxrProducts(xml: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of xml.split("<item>")) {
    if (!item.includes("<wp:post_type><![CDATA[product]]></wp:post_type>")) continue;
    const name = /<wp:post_name><!\[CDATA\[([^\]]+)\]\]>/.exec(item)?.[1];
    const content = /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/.exec(item)?.[1];
    if (name && content) map.set(name, content);
  }
  return map;
}

function rewriteLegacyAnchors(html: string): string {
  const $ = load(html, null, false);
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const u = href.startsWith("//") ? new URL(`https:${href}`) : new URL(href, "https://placeholder.local");
      const host = u.hostname.replace(/^www\./, "").toLowerCase();
      const isLegacy =
        host.includes("noofox") ||
        host.endsWith(".local") ||
        host.endsWith(".kinsta.cloud") ||
        host === "on-page.ai" ||
        host.endsWith(".on-page.ai");
      if (!isLegacy) return;
      if (!u.pathname || u.pathname === "/") return;
      $(el).attr("href", `${u.pathname}${u.search}${u.hash}`);
    } catch {
      /* keep */
    }
  });
  return $.html();
}

function applyMappedImages(html: string, urlMap: Map<string, string>): string {
  const $ = load(html, null, false);
  $("img").each((_, el) => {
    const candidates = [
      $(el).attr("src"),
      $(el).attr("data-src"),
      ...(($(el).attr("srcset") ?? $(el).attr("data-srcset") ?? "")
        .split(",")
        .map((part) => part.trim().split(/\s+/)[0])
        .filter(Boolean)),
    ]
      .filter((v): v is string => Boolean(v))
      .map(decodeAttr);
    const mapped = candidates.map((url) => urlMap.get(url)).find(Boolean);
    if (!mapped) return;
    $(el).attr("src", mapped);
    $(el).removeAttr("srcset");
    $(el).removeAttr("data-src");
    $(el).removeAttr("data-srcset");
    $(el).removeAttr("sizes");
    if (!$(el).attr("loading")) $(el).attr("loading", "lazy");
    if (!$(el).attr("decoding")) $(el).attr("decoding", "async");
  });
  return $.html();
}

function python(): string {
  const tried = ["python", "py"];
  for (const cmd of tried) {
    const probe = spawnSync(cmd, ["-c", "print(1)"], { encoding: "utf8" });
    if (probe.status === 0) return cmd;
  }
  throw new Error("Python is required to read the WordPress backup zip");
}

function listZipUploads(py: string, zipPath: string): string[] {
  const script = `
import json, sys, zipfile
z = zipfile.ZipFile(sys.argv[1])
print(json.dumps([
  n for n in z.namelist()
  if n.lower().startswith("wp-content/uploads/") and not n.endswith("/")
]))
`;
  const out = spawnSync(py, ["-c", script, zipPath], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (out.status !== 0) {
    throw new Error(out.stderr || "Failed to list zip uploads");
  }
  return JSON.parse(out.stdout) as string[];
}

function readZipEntry(py: string, zipPath: string, entry: string): Buffer {
  const script = `
import sys, zipfile
z = zipfile.ZipFile(sys.argv[1])
sys.stdout.buffer.write(z.read(sys.argv[2]))
`;
  const out = spawnSync(py, ["-c", script, zipPath, entry], {
    encoding: "buffer",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (out.status !== 0) {
    throw new Error(out.stderr.toString("utf8") || `Failed to read zip entry ${entry}`);
  }
  return out.stdout;
}

function indexUploads(names: string[]): { byRel: Map<string, ZipHit>; byStem: Map<string, ZipHit[]> } {
  const byRel = new Map<string, ZipHit>();
  const byStem = new Map<string, ZipHit[]>();
  for (const name of names) {
    const base = path.posix.basename(name.replaceAll("\\", "/"));
    const hit: ZipHit = {
      name,
      base,
      stem: stemOf(base),
      pixels: pixelsOf(base),
      original: isOriginalName(base),
    };
    byRel.set(name.replace(/^wp-content\/uploads\//i, "").toLowerCase(), hit);
    const list = byStem.get(hit.stem) ?? [];
    list.push(hit);
    byStem.set(hit.stem, list);
  }
  return { byRel, byStem };
}

function pickBest(hits: ZipHit[], preferredDir?: string): ZipHit | null {
  if (!hits.length) return null;
  const scored = hits.map((hit) => {
    const dir = path.posix.dirname(hit.name.replace(/^wp-content\/uploads\//i, "").replaceAll("\\", "/"));
    const dirBonus = preferredDir && dir.toLowerCase() === preferredDir.toLowerCase() ? 10_000_000 : 0;
    const originalBonus = hit.original ? 1_000_000 : 0;
    return { hit, score: dirBonus + originalBonus + hit.pixels };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.hit ?? null;
}

function matchUpload(
  url: string,
  index: { byRel: Map<string, ZipHit>; byStem: Map<string, ZipHit[]> },
): ZipHit | null {
  const rel = uploadsRelFromUrl(url);
  if (!rel) return null;
  const dir = path.posix.dirname(rel.replaceAll("\\", "/"));
  const base = path.posix.basename(rel);
  const stem = stemOf(base);
  const exact = index.byRel.get(rel.replaceAll("\\", "/").toLowerCase());
  const stemHits = index.byStem.get(stem) ?? [];
  if (stemHits.length) return pickBest(stemHits, dir === "." ? undefined : dir);
  return exact ?? null;
}

async function main() {
  bootstrapEnvFromFiles();
  const apply = argsHas("--apply");
  const zipPath = path.resolve(argValue("--zip") ?? DEFAULT_ZIP);
  const wxrPath = path.resolve(argValue("--wxr") ?? DEFAULT_WXR);
  if (!fs.existsSync(zipPath)) throw new Error(`Zip not found: ${zipPath}`);
  if (!fs.existsSync(wxrPath)) throw new Error(`WXR not found: ${wxrPath}`);
  if (!apply) console.log("Dry run. Pass --apply to upload and update Product.bodyHtml.");

  const py = python();
  const uploads = listZipUploads(py, zipPath);
  const index = indexUploads(uploads);
  console.log(`Indexed ${uploads.length} upload files from zip.`);

  const wxr = extractWxrProducts(fs.readFileSync(wxrPath, "utf8"));
  const needed = new Map<string, ZipHit>();
  const unmatched: { slug: string; url: string }[] = [];

  for (const [slug, html] of wxr) {
    for (const url of collectImgUrls(html)) {
      const hit = matchUpload(url, index);
      if (!hit) {
        unmatched.push({ slug, url });
        continue;
      }
      needed.set(url, hit);
    }
  }

  const uniqueFiles = new Map<string, ZipHit>();
  for (const hit of needed.values()) uniqueFiles.set(hit.name, hit);
  console.log(`Matched ${needed.size} WXR image URLs to ${uniqueFiles.size} zip files. Unmatched ${unmatched.length}.`);
  for (const miss of unmatched) {
    console.log(`  MISS ${miss.slug} ${miss.url}`);
  }

  configureCloudinaryFromEnv();
  const prisma = new PrismaClient();
  const fileUrl = new Map<string, string>();

  try {
    for (const hit of uniqueFiles.values()) {
      process.stdout.write(`${apply ? "upload" : "read"} ${hit.base}… `);
      const buf = readZipEntry(py, zipPath, hit.name);
      if (buf.length < 32) {
        console.log("FAIL empty");
        continue;
      }
      if (!apply) {
        fileUrl.set(hit.name, `https://res.cloudinary.com/dry/${crypto.createHash("sha256").update(hit.name).digest("hex").slice(0, 12)}`);
        console.log(`ok ${buf.length} bytes (dry)`);
        continue;
      }
      const ext = extFromName(hit.base);
      const hash = crypto.createHash("sha256").update(hit.name).digest("hex").slice(0, 16);
      const secureUrl = await uploadImageBufferToCloudinary({
        buffer: buf,
        contentType: mimeFromExt(ext),
        publicIdPath: `body/${hash}`,
      });
      fileUrl.set(hit.name, secureUrl);
      console.log(`→ ${secureUrl.slice(0, 80)}`);
    }

    const urlMap = new Map<string, string>();
    for (const [url, hit] of needed) {
      const hosted = fileUrl.get(hit.name);
      if (hosted) urlMap.set(url, hosted);
    }

    const products = await prisma.product.findMany({
      select: { id: true, slug: true, bodyHtml: true },
      orderBy: { slug: "asc" },
    });

    let updated = 0;
    for (const product of products) {
      const wxrHtml = wxr.get(product.slug);
      if (!wxrHtml) continue;
      const mappedCount = collectImgUrls(wxrHtml).filter((url) => urlMap.has(url)).length;
      if (!mappedCount) continue;
      const next = sanitizeProductBodyHtml(rewriteLegacyAnchors(applyMappedImages(wxrHtml, urlMap)));
      const liveImgs = collectImgUrls(product.bodyHtml ?? "").length;
      const nextImgs = collectImgUrls(next).length;
      if (next === product.bodyHtml) continue;
      updated += 1;
      console.log(
        `${apply ? "[apply]" : "[dry]"} ${product.slug} live_imgs=${liveImgs} -> ${nextImgs} (mapped ${mappedCount})`,
      );
      if (!apply) continue;
      await prisma.product.update({
        where: { id: product.id },
        data: { bodyHtml: next },
      });
    }
    console.log(`${apply ? "Done" : "Dry run"}. products ${updated}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
