/**
 * Match WooCommerce products in a WordPress WXR export (content.xml) to files under
 * a local wp-content/uploads mirror, then copy (and optionally convert to JPEG) into:
 *   <out>/product_images/<Product Name>/01-feature.jpg, 02.jpg, …
 *
 * The export must be from the same WordPress site as the uploads folder (IDs + paths line up).
 * Demo/theme exports (e.g. gpsites.co) often do not match a different uploads tree — use an export from noofox.com if that is your media source.
 *
 * Usage (from `web/`):
 *   npx tsx scripts/organize-noofox-product-images.ts \
 *     --uploads ../Noofox-Images/uploads \
 *     --xml ../noofox.WordPress.2026-05-01.xml \
 *     --out ../Noofox-Images \
 *     --jpeg
 *
 * Full-size only (no -150x150-style thumbnails; prefer `original_image` / non--scaled when metadata allows):
 *   …same flags… --originals-only
 *   → writes to ../Noofox-Images/product_images_original/
 *
 * Flags:
 *   --uploads <dir>   Local uploads root (contains YYYY/MM/… or sites/N/YYYY/MM/…).
 *   --xml <file>      WordPress export XML. If omitted, searches for content.xml under --uploads parent.
 *   --out <dir>       Destination root (creates product_images inside unless --flat-out).
 *   --flat-out        Write directly into --out instead of <out>/product_images.
 *   --jpeg            Encode outputs as .jpg (requires `sharp`). Without --jpeg, files are copied with original extension.
 *   --dry-run          Print actions only.
 *   --originals-only   Use full-size uploads only (skip WordPress -150x150-style derivatives; prefer
 *                      `original_image` from attachment metadata and paths without `-scaled` when present).
 *                      Writes under …/product_images_original/ (change parent with --out).
 */

import fs from "node:fs/promises";
import path from "node:path";

type ParsedMeta = Record<string, string>;

type AttachmentRow = { id: string; attachedRel: string; metaSerial?: string };

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

/** Strip CDATA or plain text inside a tag (handles `wp:…` namespaced tags). */
function innerTag(block: string, tag: string): string | null {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<${escaped}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))\\s*</${escaped}>`,
    "i",
  );
  const m = block.match(re);
  if (!m) return null;
  const v = (m[1] ?? m[2] ?? "").trim();
  return v.length ? v : null;
}

function extractPostMetas(itemBlock: string): ParsedMeta {
  const meta: ParsedMeta = {};
  const chunkRe = /<wp:postmeta>[\s\S]*?<\/wp:postmeta>/gi;
  let m: RegExpExecArray | null;
  while ((m = chunkRe.exec(itemBlock)) !== null) {
    const chunk = m[0];
    const key = innerTag(chunk, "wp:meta_key");
    const val = innerTag(chunk, "wp:meta_value");
    if (key && val !== null && val !== undefined) meta[key] = val;
  }
  return meta;
}

function parseExport(xml: string) {
  const attachments = new Map<string, AttachmentRow>();
  const products: {
    title: string;
    slug: string;
    thumbnailId: string | null;
    galleryIds: string[];
  }[] = [];

  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let im: RegExpExecArray | null;
  while ((im = itemRe.exec(xml)) !== null) {
    const block = im[1];
    const postType = innerTag(block, "wp:post_type");
    if (!postType) continue;

    const postId = innerTag(block, "wp:post_id");
    const metas = extractPostMetas(block);

    if (postType === "attachment" && postId) {
      const rel = metas["_wp_attached_file"];
      if (rel && /\.(jpe?g|png|gif|webp|avif)$/i.test(rel)) {
        attachments.set(postId, {
          id: postId,
          attachedRel: rel.replace(/^\/+/, ""),
          metaSerial: metas["_wp_attachment_metadata"],
        });
      }
      continue;
    }

    if (postType === "product") {
      const title = innerTag(block, "title") ?? "Product";
      const slug = innerTag(block, "wp:post_name") ?? "product";
      const thumb = metas["_thumbnail_id"]?.trim() || null;
      const galleryRaw = metas["_product_image_gallery"]?.trim() ?? "";
      const galleryIds = galleryRaw
        ? galleryRaw
            .split(/[,|\s]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      products.push({ title, slug, thumbnailId: thumb, galleryIds });
    }
  }

  return { attachments, products };
}

function sanitizeFolderName(name: string, slug: string): string {
  let s = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");
  if (!s) s = slug.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "product";
  return s.slice(0, 120);
}

async function pathExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** WordPress-generated resized filenames (150x150, 1024x1024, …). Not “original”. */
function isWpResizedDerivativeFilename(filename: string): boolean {
  return /-\d+x\d+(?:@[^.]*)?\.[a-z0-9]+$/i.test(path.posix.basename(filename));
}

/** Top-level `file` path in `_wp_attachment_metadata` (not thumbnail rows inside `sizes`). */
function extractAttachmentPrimaryFile(serialized: string): string | null {
  const beforeSizes = serialized.split(/";s:5:"sizes"/)[0];
  const matches = [...beforeSizes.matchAll(/s:4:"file";s:(\d+):"/g)];
  if (matches.length === 0) return null;
  const m = matches[matches.length - 1];
  const len = parseInt(m[1], 10);
  const idx = m.index! + m[0].length;
  return beforeSizes.slice(idx, idx + len);
}

/** `original_image` basename/path fragment stored after scaled uploads. */
function extractAttachmentOriginalImage(serialized: string): string | null {
  const matches = [...serialized.matchAll(/s:14:"original_image";s:(\d+):"/g)];
  if (matches.length === 0) return null;
  const m = matches[matches.length - 1];
  const len = parseInt(m[1], 10);
  const idx = m.index! + m[0].length;
  return serialized.slice(idx, idx + len);
}

async function tryResolveUploadRel(uploadsRoot: string, relPosix: string): Promise<string | null> {
  const norm = relPosix.replace(/^\/+/, "").replace(/\\/g, "/");
  const tries = [path.join(uploadsRoot, norm)];
  const sitesRoot = path.join(uploadsRoot, "sites");
  try {
    const ents = await fs.readdir(sitesRoot, { withFileTypes: true });
    for (const e of ents) {
      if (e.isDirectory()) tries.push(path.join(sitesRoot, e.name, norm));
    }
  } catch {
    /* no sites */
  }
  for (const p of tries) {
    if (await pathExists(p)) return p;
  }
  return null;
}

/** Resolve _wp_attached_file relative path on disk (single-site or multisite uploads). */
async function resolveSourcePath(uploadsRoot: string, attachedRel: string): Promise<string | null> {
  const norm = attachedRel.replace(/^\/+/, "").replace(/\\/g, "/");

  let hit = await tryResolveUploadRel(uploadsRoot, norm);
  if (hit) return hit;

  const dir = path.posix.dirname(norm);
  const base = path.posix.basename(norm);

  if (base.includes("-scaled.")) {
    hit = await tryResolveUploadRel(uploadsRoot, path.posix.join(dir, base.replace("-scaled.", ".")));
    if (hit) return hit;
  } else {
    const dot = base.lastIndexOf(".");
    if (dot > 0) {
      hit = await tryResolveUploadRel(uploadsRoot, path.posix.join(dir, `${base.slice(0, dot)}-scaled${base.slice(dot)}`));
      if (hit) return hit;
    }
  }

  return null;
}

/**
 * Prefer true originals: metadata `original_image`, then `_wp_attached_file` without `-scaled`,
 * never `-WxW` thumbnails.
 */
async function resolveOriginalSourcePath(uploadsRoot: string, row: AttachmentRow): Promise<string | null> {
  const norm = row.attachedRel.replace(/^\/+/, "").replace(/\\/g, "/");
  const dirFromAttached = path.posix.dirname(norm);
  const baseAttached = path.posix.basename(norm);

  const meta = row.metaSerial ?? "";
  const metaFile = meta ? extractAttachmentPrimaryFile(meta) : null;
  const metaOriginal = meta ? extractAttachmentOriginalImage(meta) : null;

  const metaDir =
    metaFile && metaFile.includes("/") ? path.posix.dirname(metaFile.replace(/\\/g, "/")) : dirFromAttached;

  const candidates: string[] = [];

  if (metaOriginal && !isWpResizedDerivativeFilename(metaOriginal)) {
    candidates.push(path.posix.join(metaDir, path.posix.basename(metaOriginal)));
  }

  if (!isWpResizedDerivativeFilename(baseAttached)) {
    if (baseAttached.includes("-scaled.")) {
      candidates.push(path.posix.join(metaDir, baseAttached.replace("-scaled.", ".")));
    }
    candidates.push(path.posix.join(metaDir, baseAttached));
  }

  const uniq = [...new Set(candidates)];

  for (const rel of uniq) {
    if (isWpResizedDerivativeFilename(rel)) continue;
    const hit = await tryResolveUploadRel(uploadsRoot, rel);
    if (hit && !isWpResizedDerivativeFilename(hit)) return hit;
  }

  // Folder mismatch: try dirname from attached path with meta-original basename
  if (metaOriginal && !isWpResizedDerivativeFilename(metaOriginal)) {
    const hit = await tryResolveUploadRel(uploadsRoot, path.posix.join(dirFromAttached, path.posix.basename(metaOriginal)));
    if (hit && !isWpResizedDerivativeFilename(hit)) return hit;
  }

  const fallbackNorm = norm;
  if (!isWpResizedDerivativeFilename(fallbackNorm)) {
    const hit = await tryResolveUploadRel(uploadsRoot, fallbackNorm);
    if (hit && !isWpResizedDerivativeFilename(hit)) return hit;
  }

  return null;
}

function orderedAttachmentIds(thumbnailId: string | null, galleryIds: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  if (thumbnailId) {
    out.push(thumbnailId);
    seen.add(thumbnailId);
  }
  for (const id of galleryIds) {
    if (!seen.has(id)) {
      out.push(id);
      seen.add(id);
    }
  }
  return out;
}

async function findDefaultXml(uploadsParent: string): Promise<string | null> {
  const candidates: string[] = [];
  async function walk(dir: string, depth: number) {
    if (depth > 6) return;
    let ents;
    try {
      ents = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full, depth + 1);
      else if (e.name.toLowerCase() === "content.xml") candidates.push(full);
    }
  }
  await walk(uploadsParent, 0);
  return candidates[0] ?? null;
}

type SharpFn = typeof import("sharp");

async function ensureSharp(): Promise<SharpFn | null> {
  try {
    const mod = await import("sharp");
    const candidate = mod as unknown as { default?: SharpFn };
    const fn = candidate.default ?? (mod as unknown as SharpFn);
    return typeof fn === "function" ? fn : null;
  } catch {
    return null;
  }
}

async function writeOutput(sharpMod: NonNullable<Awaited<ReturnType<typeof ensureSharp>>>, srcPath: string, destPath: string) {
  await sharpMod(srcPath).jpeg({ quality: 92, mozjpeg: true }).toFile(destPath);
}

async function main() {
  const uploadsRoot = path.resolve(process.cwd(), argValue("--uploads") ?? "");
  let xmlPath = argValue("--xml");
  const outArg = argValue("--out");
  const flatOut = hasFlag("--flat-out");
  const useJpeg = hasFlag("--jpeg");
  const dryRun = hasFlag("--dry-run");
  const originalsOnly = hasFlag("--originals-only");

  if (!uploadsRoot) {
    console.error("Missing --uploads <path-to-wp-uploads-folder>");
    process.exit(1);
  }
  if (!(await pathExists(uploadsRoot))) {
    console.error("Uploads directory not found:", uploadsRoot);
    process.exit(1);
  }

  if (!xmlPath) {
    const guessed = await findDefaultXml(path.resolve(uploadsRoot, ".."));
    if (!guessed) {
      console.error("Could not find content.xml; pass --xml explicitly.");
      process.exit(1);
    }
    xmlPath = guessed;
    console.log("Using XML:", xmlPath);
  }

  xmlPath = path.resolve(process.cwd(), xmlPath);
  const bundleFolder = originalsOnly ? "product_images_original" : "product_images";
  const destRoot = path.resolve(process.cwd(), outArg ?? path.dirname(uploadsRoot));
  const productRoot = flatOut ? destRoot : path.join(destRoot, bundleFolder);

  const xml = await fs.readFile(xmlPath, "utf8");
  const { attachments, products } = parseExport(xml);

  console.log(`Parsed XML: ${products.length} products, ${attachments.size} image attachments with _wp_attached_file.`);
  if (originalsOnly) console.log("Mode: originals-only (skip -WxW thumbnails; prefer metadata original_image / non-scaled file).");

  if (products.length === 0) {
    console.warn("No <product> items found — check that this export includes WooCommerce products.");
    process.exit(0);
  }

  const sharpMod = useJpeg ? await ensureSharp() : null;
  if (useJpeg && !sharpMod) {
    console.error("--jpeg requires sharp. From web/: npm i -D sharp");
    process.exit(1);
  }

  let copied = 0;
  let missing = 0;
  const usedNames = new Map<string, number>();

  for (const p of products) {
    let folderBase = sanitizeFolderName(p.title, p.slug);
    const n = (usedNames.get(folderBase) ?? 0) + 1;
    usedNames.set(folderBase, n);
    if (n > 1) folderBase = `${folderBase}__${p.slug}`;

    const ids = orderedAttachmentIds(p.thumbnailId, p.galleryIds);
    if (ids.length === 0) {
      console.log(`→ ${p.title}: no thumbnail/gallery IDs`);
      continue;
    }

    const destDir = path.join(productRoot, folderBase);
    if (!dryRun) await fs.mkdir(destDir, { recursive: true });

    let idx = 0;
    for (const aid of ids) {
      const att = attachments.get(aid);
      if (!att) {
        console.warn(`  [skip] attachment id ${aid} not in export (missing attachment item)`);
        missing++;
        continue;
      }
      const src = originalsOnly
        ? await resolveOriginalSourcePath(uploadsRoot, att)
        : await resolveSourcePath(uploadsRoot, att.attachedRel);
      if (!src) {
        console.warn(`  [missing file] ${originalsOnly ? "(original) " : ""}${att.attachedRel}`);
        missing++;
        continue;
      }

      idx++;
      const baseName =
        idx === 1 ? `01-feature${useJpeg ? ".jpg" : path.extname(src)}` : `${String(idx).padStart(2, "0")}${useJpeg ? ".jpg" : path.extname(src)}`;

      const destFile = path.join(destDir, baseName);

      if (dryRun) {
        console.log(`[dry] ${src} -> ${destFile}`);
      } else if (useJpeg && sharpMod) {
        await writeOutput(sharpMod, src, destFile);
      } else {
        await fs.copyFile(src, destFile);
      }
      copied++;
    }

    console.log(`→ ${p.title}: ${ids.length} id(s), wrote ${idx} file(s) → ${path.relative(process.cwd(), destDir)}`);
  }

  console.log(`Done. ${dryRun ? "Dry-run —" : ""} copied/fetched slots: ${copied}, unresolved: ${missing}`);
  console.log(`Output root: ${productRoot}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
