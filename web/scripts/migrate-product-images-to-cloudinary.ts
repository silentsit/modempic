/**
 * Upload gallery images that are still stored as local paths (/imported-products/…)
 * to Cloudinary and update ProductImage rows + Product.bodyHtml.
 *
 * From web/ (requires DATABASE_URL + Cloudinary env — same as import:noofox:cloudinary):
 *   npx tsx scripts/migrate-product-images-to-cloudinary.ts           # dry-run
 *   npx tsx scripts/migrate-product-images-to-cloudinary.ts --apply
 *
 * Reads files from web/public. Run `npm run images:placeholders` first if imported-products is empty locally.
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { configureCloudinaryFromEnv, uploadImageBufferToCloudinary } from "./cloudinary-upload";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(SCRIPT_DIR, "..");
const PUBLIC_ROOT = path.join(WEB_ROOT, "public");

function argsHas(flag: string) {
  return process.argv.includes(flag);
}

function slugDirPart(slug: string) {
  return slug.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "product";
}

function collectAbsoluteVariants(localPath: string): string[] {
  const roots = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter(Boolean) as string[];
  const origins = roots.map((r) => r.replace(/\/$/, ""));
  const out = new Set<string>();
  for (const origin of origins) {
    out.add(`${origin}${localPath.startsWith("/") ? localPath : `/${localPath}`}`);
  }
  return [...out];
}

function applyUrlReplacements(html: string | null, urlMap: Map<string, string>): string | null {
  if (!html || urlMap.size === 0) return html;
  let next = html;
  const pairs: { from: string; to: string }[] = [];
  for (const [localPath, secureUrl] of urlMap) {
    pairs.push({ from: localPath, to: secureUrl });
    for (const abs of collectAbsoluteVariants(localPath)) {
      pairs.push({ from: abs, to: secureUrl });
    }
  }
  pairs.sort((a, b) => b.from.length - a.from.length);
  for (const { from, to } of pairs) {
    next = next.split(from).join(to);
  }
  return next;
}

async function readLocalProductImageBytes(
  publicRoot: string,
  url: string,
): Promise<{ buf: Buffer; ctype: string | null }> {
  const rel = url.startsWith("/") ? url.slice(1) : url;
  const full = path.join(publicRoot, rel);
  const buf = await fs.readFile(full);
  const ext = path.extname(full).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : ext === ".avif"
            ? "image/avif"
            : "image/jpeg";
  return { buf, ctype: mime };
}

async function main() {
  const apply = argsHas("--apply");
  if (!apply) {
    console.log("Dry run (no DB writes). Pass --apply to upload and update records.");
  }

  try {
    configureCloudinaryFromEnv();
  } catch (e) {
    console.error(String(e));
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const products = await prisma.product.findMany({
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: { slug: "asc" },
    });

    let productsTouched = 0;
    let imagesUploaded = 0;
    let skippedMissingFile = 0;
    let skippedNonLocal = 0;

    for (const product of products) {
      const sorted = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
      const urlMap = new Map<string, string>();

      for (let i = 0; i < sorted.length; i++) {
        const im = sorted[i];
        const raw = im.url.trim();
        if (raw.includes("res.cloudinary.com")) continue;
        if (!raw.startsWith("/imported-products/")) {
          skippedNonLocal++;
          continue;
        }

        let secureUrl: string;
        try {
          const { buf, ctype } = await readLocalProductImageBytes(PUBLIC_ROOT, raw);
          const hash = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 14);
          const publicPath = `${slugDirPart(product.slug)}/${String(i).padStart(2, "0")}-${hash}`;
          if (!apply) {
            console.log(`[dry] ${product.slug} | ${raw} → Cloudinary …/${publicPath}`);
            secureUrl = `https://res.cloudinary.com/…/${publicPath}`;
          } else {
            secureUrl = await uploadImageBufferToCloudinary({
              buffer: buf,
              contentType: ctype,
              publicIdPath: publicPath,
            });
            console.log(`[apply] ${product.slug} | uploaded → ${secureUrl.slice(0, 72)}…`);
          }
          urlMap.set(raw, secureUrl);
          imagesUploaded++;
        } catch (e) {
          console.warn(`  [skip] ${product.slug} | missing or unreadable ${raw}: ${e}`);
          skippedMissingFile++;
        }
      }

      if (urlMap.size === 0) continue;
      productsTouched++;

      const bodyHtml = applyUrlReplacements(product.bodyHtml, urlMap);

      if (!apply) continue;

      await prisma.$transaction(async (tx) => {
        for (const im of sorted) {
          const next = urlMap.get(im.url.trim());
          if (!next) continue;
          await tx.productImage.update({ where: { id: im.id }, data: { url: next } });
        }
        if (bodyHtml !== product.bodyHtml) {
          await tx.product.update({
            where: { id: product.id },
            data: { bodyHtml },
          });
        }
      });
    }

    console.log(
      apply
        ? `Done. Products updated: ${productsTouched}. Images uploaded: ${imagesUploaded}. Skipped (not local path): ${skippedNonLocal}. Skipped (file error): ${skippedMissingFile}.`
        : `Dry run finished. Would touch ${productsTouched} product(s), upload ${imagesUploaded} image(s). Skipped non-local: ${skippedNonLocal}. File errors: ${skippedMissingFile}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
