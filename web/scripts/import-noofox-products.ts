/**
 * Import products from noofox.com WooCommerce using the public product sitemap.
 *
 * Usage (from `web/`):
 *   npx tsx scripts/import-noofox-products.ts                      # dry-run
 *   npx tsx scripts/import-noofox-products.ts --apply           # upsert DB (DATABASE_URL)
 *   npx tsx scripts/import-noofox-products.ts --apply --download-images      # DB + download images to public/imported-products/
 *   npx tsx scripts/import-noofox-products.ts --apply --use-local-manifest    # DB + gallery URLs from scripts/noofox-import-manifest.json (after --download-only)
 *   npx tsx scripts/import-noofox-products.ts --download-only             # images only (no DATABASE_URL)
 *
 * Env:
 *   MODEMPIC_PUBLIC_URL — origin for rewriting anchor links away from noofox (images unchanged unless downloading / manifest)
 *   NOOFOX_MANIFEST_PATH — optional override for manifest JSON (default scripts/noofox-import-manifest.json)
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { load, type CheerioAPI } from "cheerio";
import { PrismaClient, ProductStatus } from "@prisma/client";

const SITEMAP = "https://noofox.com/product-sitemap.xml";
const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1584308666744-24d5c474e2ae?w=800&q=80";

type WcVariation = {
  display_price?: number;
  display_regular_price?: number;
  attributes?: Record<string, string>;
};

type Tier = { label: string; priceCents: number; compareAtCents?: number };

function argsHas(flag: string) {
  return process.argv.includes(flag);
}

function uniqueStrings(urls: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    const t = u.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Rewrites only `<a href="…noofox…">` targets. Does not touch `<img src>` so hotlinked images keep working. */
function rewriteAnchorLinks(html: string, publicBase: string): string {
  if (!html) return html;
  const origin = publicBase.replace(/\/$/, "");
  const $ = load(html, null, false);
  $("a[href*='noofox.com']").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const u = href.startsWith("//") ? new URL(`https:${href}`) : new URL(href);
      if (!u.hostname.includes("noofox.com")) return;
      $(el).attr("href", `${origin}${u.pathname}${u.search}${u.hash}`);
    } catch {
      /* keep */
    }
  });
  return $.html();
}

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
};

function extFromMime(mime: string | null, fallback: string): string {
  if (!mime) return fallback;
  const base = mime.split(";")[0].trim().toLowerCase();
  return MIME_EXT[base] ?? fallback;
}

function slugDirPart(slug: string) {
  return slug.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "product";
}

/** Remote URL → public path (/imported-products/…) after download. Deduped across one import run. */
const downloadedUrlToPublic = new Map<string, string>();

async function fetchImageBytes(url: string) {
  const res = await fetchWithRetry(url, {
    headers: {
      "user-agent": "ModempicImport/1.0 (+https://modempic.com)",
      accept: "image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 32) throw new Error(`Tiny response from ${url}`);
  return { buf, ctype: res.headers.get("content-type") };
}

async function downloadProductImage(remoteUrl: string, slug: string, index: number, publicRoot: string) {
  const normalized = remoteUrl.startsWith("//") ? `https:${remoteUrl}` : remoteUrl;
  const cached = downloadedUrlToPublic.get(normalized);
  if (cached) return cached;

  let pathnameFallback = ".jpg";
  try {
    pathnameFallback = path.extname(new URL(normalized).pathname.split("?")[0] || "") || ".jpg";
  } catch {
    /* use .jpg */
  }

  const { buf, ctype } = await fetchImageBytes(normalized);
  const ext = extFromMime(ctype, pathnameFallback.startsWith(".") ? pathnameFallback : ".jpg");
  const hash = crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 14);
  const dir = path.join(publicRoot, "imported-products", slugDirPart(slug));
  const filename = `${String(index).padStart(2, "0")}-${hash}${ext}`;
  const full = path.join(dir, filename);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(full, buf);

  const rel = path.posix.join("/imported-products", slugDirPart(slug), filename);
  downloadedUrlToPublic.set(normalized, rel);
  return rel;
}

/** Point `<img>` tags at downloaded paths when the remote URL was saved. */
function replaceImageUrlsInHtml(html: string | null, pairs: { remote: string; local: string }[]): string | null {
  if (!html || pairs.length === 0) return html;
  const lookup = new Map<string, string>();
  for (const { remote, local } of pairs) {
    lookup.set(remote, local);
    const abs = remote.startsWith("//") ? `https:${remote}` : remote;
    lookup.set(abs, local);
  }
  const $ = load(html, null, false);
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    const key = src.startsWith("//") ? `https:${src}` : src;
    const rep = lookup.get(src) ?? lookup.get(key);
    if (rep) $(el).attr("src", rep);
  });
  $("img[srcset]").each((_, el) => {
    const s = $(el).attr("srcset");
    if (!s) return;
    const next = s
      .split(",")
      .map((part) => {
        const t = part.trim();
        const sp = t.indexOf(" ");
        const urlPart = sp === -1 ? t : t.slice(0, sp).trim();
        const rest = sp === -1 ? "" : t.slice(sp);
        const key = urlPart.startsWith("//") ? `https:${urlPart}` : urlPart;
        const rep = lookup.get(urlPart) ?? lookup.get(key);
        return rep ? `${rep}${rest}` : t;
      })
      .join(", ");
    $(el).attr("srcset", next);
  });
  return $.html();
}

async function localizeImagesForProduct(
  slug: string,
  images: { url: string; alt: string; sortOrder: number }[],
  bodyHtml: string | null,
  publicRoot: string,
) {
  const mapping: { remote: string; local: string }[] = [];
  const outImgs: { url: string; alt: string; sortOrder: number }[] = [];

  for (let i = 0; i < images.length; i++) {
    const im = images[i];
    const raw = im.url;
    if (raw.startsWith("/imported-products/") || !raw.includes("noofox.com")) {
      outImgs.push(im);
      continue;
    }
    try {
      const normalized = raw.startsWith("//") ? `https:${raw}` : raw;
      const localPath = await downloadProductImage(raw, slug, i, publicRoot);
      mapping.push({ remote: raw, local: localPath });
      mapping.push({ remote: normalized, local: localPath });
      outImgs.push({ ...im, url: localPath });
    } catch (e) {
      console.warn(`  [image] keep remote ${raw.slice(0, 60)}… (${e})`);
      outImgs.push(im);
    }
  }

  const newBody = replaceImageUrlsInHtml(bodyHtml, mapping);
  return { images: outImgs, bodyHtml: newBody };
}

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseTiersFromWc(raw: string | undefined): Tier[] {
  if (!raw) return [];
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(json)) return [];
  const tiers: Tier[] = [];
  for (const row of json) {
    const v = row as WcVariation;
    const attrs = v.attributes ?? {};
    const label = (Object.values(attrs)[0] as string | undefined)?.trim() ?? "";
    const dp = typeof v.display_price === "number" ? v.display_price : null;
    if (!label || dp === null) continue;
    const reg = typeof v.display_regular_price === "number" ? v.display_regular_price : dp;
    const priceCents = Math.round(dp * 100);
    const compareAtCents = reg > dp ? Math.round(reg * 100) : undefined;
    tiers.push({ label, priceCents, compareAtCents });
  }
  return tiers;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, init: RequestInit, attempts = 5): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      const retryable = !res.ok && (res.status >= 500 || res.status === 429 || res.status === 530);
      if (retryable && i < attempts - 1) {
        await sleep(2000 * (i + 1));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await sleep(2000 * (i + 1));
      else throw e;
    }
  }
  throw lastErr;
}

async function fetchText(url: string) {
  const res = await fetchWithRetry(url, {
    headers: {
      "user-agent": "ModempicImport/1.0 (+https://modempic.com)",
      accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

function parsePriceFromSummary($: CheerioAPI): { priceCents: number; compareAtCents?: number } | null {
  const nums = $(".summary .price .woocommerce-Price-amount bdi, .summary .woocommerce-Price-amount.amount bdi")
    .map((_, el) => {
      const t = $(el).text().replace(/[^0-9.]/g, "");
      return parseFloat(t);
    })
    .get()
    .filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return null;
  if (nums.length === 1) return { priceCents: Math.round(nums[0] * 100) };
  const low = Math.min(...nums);
  const high = Math.max(...nums);
  return { priceCents: Math.round(low * 100), compareAtCents: high > low ? Math.round(high * 100) : undefined };
}

async function scrapeProduct(productUrl: string, publicBase: string) {
  const html = await fetchText(productUrl);
  const $ = load(html);

  const slug = new URL(productUrl).pathname.replace(/^\//, "").replace(/\/$/, "") || "product";

  const name =
    $("h1.product_title").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.split("|")[0]?.trim() ||
    slug;

  const metaDesc = $('meta[name="description"]').attr("content")?.trim() || "";
  const titleTag = $("title").first().text().trim();
  const seoTitle = titleTag
    ? titleTag.replace(/\s*\|\s*Noofox\s*$/i, " | Modempic").replace(/\s+/g, " ")
    : `${name} | Modempic`;

  const shortHtml = $(".woocommerce-product-details__short-description").first().html() ?? "";
  const shortDesc = stripTags(shortHtml) || stripTags($("#tab-description").html() ?? "") || metaDesc || name;

  const tabHtml = $("#tab-description").html() ?? "";
  const bodyHtml = tabHtml ? rewriteAnchorLinks(tabHtml, publicBase) : "";

  let tiers = parseTiersFromWc($("form.variations_form").attr("data-product_variations"));
  const priceBlock = parsePriceFromSummary($);
  if (tiers.length === 0 && priceBlock) {
    tiers = [{ label: "Standard", priceCents: priceBlock.priceCents, compareAtCents: priceBlock.compareAtCents }];
  }
  const primary = tiers.length
    ? tiers.reduce((a, b) => (a.priceCents <= b.priceCents ? a : b))
    : priceBlock
      ? { label: "Standard", priceCents: priceBlock.priceCents, compareAtCents: priceBlock.compareAtCents }
      : null;
  if (!primary) throw new Error(`No price for ${productUrl}`);

  const galleryImgs = $(".woocommerce-product-gallery__wrapper img")
    .map((_, el) => {
      const $el = $(el);
      return $el.attr("data-large_image") || $el.attr("data-src") || $el.attr("src");
    })
    .get()
    .filter(Boolean) as string[];

  const contentImgs = $("#tab-description img")
    .map((_, el) => $(el).attr("src"))
    .get()
    .filter(Boolean) as string[];

  const allImgs = uniqueStrings(
    [...galleryImgs, ...contentImgs].map((u) => (u.startsWith("//") ? `https:${u}` : u)),
  );

  const images =
    allImgs.length > 0
      ? allImgs.map((url, i) => ({ url, alt: name, sortOrder: i }))
      : [{ url: PLACEHOLDER_IMG, alt: name, sortOrder: 0 }];

  const longPlain = stripTags(bodyHtml).slice(0, 18000) || shortDesc.slice(0, 5000);

  return {
    slug,
    name: name.slice(0, 200),
    shortDesc: shortDesc.slice(0, 500),
    longDesc: longPlain,
    bodyHtml: bodyHtml || null,
    seoTitle: seoTitle.slice(0, 200),
    seoDesc: metaDesc.slice(0, 300) || shortDesc.slice(0, 300),
    priceCents: primary.priceCents,
    compareAtCents: primary.compareAtCents ?? null,
    variants: tiers.length ? tiers : undefined,
    images,
  };
}

type ScrapedProduct = Awaited<ReturnType<typeof scrapeProduct>>;

type ManifestFile = {
  generatedAt?: string;
  products: { slug: string; name?: string; imagePaths: string[] }[];
};

async function tryLoadManifest(relPath: string): Promise<ManifestFile | null> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), relPath), "utf8");
    const j = JSON.parse(raw) as ManifestFile;
    return j?.products?.length ? j : null;
  } catch {
    return null;
  }
}

function mergeManifestImages(manifest: ManifestFile, slug: string, data: ScrapedProduct): ScrapedProduct {
  const row = manifest.products.find((p) => p.slug === slug);
  if (!row?.imagePaths?.length) return data;
  return {
    ...data,
    images: row.imagePaths.map((url, i) => ({
      url,
      alt: data.name.slice(0, 200),
      sortOrder: i,
    })),
  };
}

function loadSitemapLocs(xml: string) {
  const locs = Array.from(xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)).map((m) => m[1].trim());
  return locs.filter((u) => u.includes("noofox.com") && !u.replace(/\/$/, "").endsWith("/shop"));
}

async function main() {
  const apply = argsHas("--apply");
  const downloadOnly = argsHas("--download-only");
  const downloadImages = argsHas("--download-images");
  const useLocalManifest = argsHas("--use-local-manifest");
  const manifestPath = process.env.NOOFOX_MANIFEST_PATH ?? "scripts/noofox-import-manifest.json";
  const publicBase = process.env.MODEMPIC_PUBLIC_URL ?? "https://localhost:3000";

  if (downloadImages && !apply && !downloadOnly) {
    console.warn("Note: use --apply --download-images for DB + files, or --download-only for files without the database.");
  }

  if (apply && useLocalManifest && downloadImages) {
    console.warn("--download-images ignored with --use-local-manifest (gallery images come from manifest paths).");
  }

  if (downloadOnly && apply) {
    console.error("Use either --download-only or --apply, not both.");
    process.exit(1);
  }

  console.log(`Sitemap: ${SITEMAP}`);
  const xml = await fetchText(SITEMAP);
  const locs = loadSitemapLocs(xml);
  console.log(`Product URLs found: ${locs.length}`);

  let manifestFile: ManifestFile | null = null;
  if (useLocalManifest) {
    manifestFile = await tryLoadManifest(manifestPath);
    if (!manifestFile) console.warn(`--use-local-manifest: could not load ${manifestPath} (gallery URLs will stay remote).`);
    else console.log(`Loaded manifest: ${manifestFile.products.length} products`);
  }

  const prisma = apply ? new PrismaClient() : null;
  const manifestRows: { slug: string; name: string; imagePaths: string[] }[] = [];
  try {
    if ((apply && downloadImages) || downloadOnly) downloadedUrlToPublic.clear();

    let categoryId: string | null = null;
    if (prisma) {
      const cat = await prisma.category.upsert({
        where: { slug: "modafinil" },
        create: {
          slug: "modafinil",
          name: "Modafinil",
          description: "Modafinil and armodafinil-line products.",
          seoTitle: "Modafinil | Modempic",
          seoDesc: "Browse modafinil-range products.",
        },
        update: {},
      });
      categoryId = cat.id;
    }

    const publicRoot = path.join(process.cwd(), "public");
    const skipDownloadBecauseManifest = Boolean(apply && useLocalManifest);
    const shouldDownloadFiles =
      downloadOnly || (Boolean(apply && prisma && categoryId && downloadImages) && !skipDownloadBecauseManifest);

    for (const url of locs) {
      try {
        let data = await scrapeProduct(url, publicBase);
        if (useLocalManifest && manifestFile) {
          data = mergeManifestImages(manifestFile, data.slug, data);
        }
        if (shouldDownloadFiles) {
          await fs.mkdir(path.join(publicRoot, "imported-products"), { recursive: true });
          const loc = await localizeImagesForProduct(data.slug, data.images, data.bodyHtml, publicRoot);
          data = { ...data, images: loc.images, bodyHtml: loc.bodyHtml };
          const tag = downloadOnly ? "[download-only]" : "[apply]";
          console.log(
            `${tag} ${data.slug} — ${data.name} (${data.images.length} imgs saved locally, ${data.variants?.length ?? 0} tiers)`,
          );
          if (downloadOnly) {
            manifestRows.push({
              slug: data.slug,
              name: data.name,
              imagePaths: data.images.map((i) => i.url).filter((u) => u.startsWith("/imported-products/")),
            });
          }
        } else {
          const imgNote = useLocalManifest && manifestFile ? "manifest paths" : "remote";
          console.log(
            `${apply ? "[apply]" : "[dry]"} ${data.slug} — ${data.name} (${data.images.length} imgs ${imgNote}, ${data.variants?.length ?? 0} tiers)`,
          );
        }
        if (downloadOnly) continue;
        if (!prisma || !categoryId) continue;

        const product = await prisma.product.upsert({
          where: { slug: data.slug },
          create: {
            slug: data.slug,
            name: data.name,
            shortDesc: data.shortDesc,
            longDesc: data.longDesc,
            bodyHtml: data.bodyHtml,
            variants: data.variants ?? undefined,
            priceCents: data.priceCents,
            compareAtCents: data.compareAtCents,
            status: ProductStatus.PUBLISHED,
            isBestSeller: false,
            seoTitle: data.seoTitle,
            seoDesc: data.seoDesc,
          },
          update: {
            name: data.name,
            shortDesc: data.shortDesc,
            longDesc: data.longDesc,
            bodyHtml: data.bodyHtml,
            variants: data.variants ?? undefined,
            priceCents: data.priceCents,
            compareAtCents: data.compareAtCents ?? undefined,
            seoTitle: data.seoTitle,
            seoDesc: data.seoDesc,
          },
        });

        await prisma.productImage.deleteMany({ where: { productId: product.id } });
        await prisma.$transaction(
          data.images.map((im, idx) =>
            prisma.productImage.create({
              data: { productId: product.id, url: im.url, alt: im.alt, sortOrder: idx },
            }),
          ),
        );

        await prisma.productCategory.deleteMany({ where: { productId: product.id } });
        await prisma.productCategory.create({ data: { productId: product.id, categoryId } });
      } catch (e) {
        console.error(`Error for ${url}:`, e);
      }
    }

    if (downloadOnly && manifestRows.length > 0) {
      const outManifestPath = path.join(process.cwd(), "scripts", "noofox-import-manifest.json");
      await fs.writeFile(
        outManifestPath,
        JSON.stringify({ generatedAt: new Date().toISOString(), products: manifestRows }, null, 2),
      );
      console.log(`Wrote ${outManifestPath}`);
    }

    if (apply) console.log("Done. Revalidate /shop and product pages as needed.");
    if (downloadOnly) console.log("Download-only finished. Run with --apply (and DATABASE_URL) to import catalog into the DB.");
  } finally {
    if (prisma) await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
