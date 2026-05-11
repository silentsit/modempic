/**
 * Import WooCommerce product reviews from `export-reviews.csv`.
 *
 * Maps Woo `product_sku` (e.g. 3692) to Modempic products using the same name-matching
 * strategy as `import-noofox-users-orders.ts`, backed by order-export line item titles.
 *
 * Usage (from `web/` with DATABASE_URL in `.env` / `.env.local`):
 *   dotenv -e .env -e .env.local -- npx tsx scripts/import-woo-reviews.ts
 *   dotenv -e .env -e .env.local -- npx tsx scripts/import-woo-reviews.ts --apply
 *
 * Options:
 *   --reviews path/to/export-reviews.csv
 *   --orders  path/to/order-export.csv  (builds SKU → product line title map)
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient, ProductStatus, ReviewStatus, Role } from "@prisma/client";

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
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

bootstrapEnvFromFiles();

const prisma = new PrismaClient();

function repoRootDir(): string {
  return path.resolve(process.cwd(), "..");
}

function args() {
  const argv = process.argv.slice(2);
  let reviewsCsv = path.join(repoRootDir(), "export-reviews.csv");
  let ordersCsv = path.join(repoRootDir(), "order-export-2026-05-10-10-50-03.csv");
  let apply = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") apply = true;
    else if (a === "--reviews") reviewsCsv = path.resolve(argv[++i] ?? "");
    else if (a === "--orders") ordersCsv = path.resolve(argv[++i] ?? "");
  }
  return { reviewsCsv, ordersCsv, apply };
}

function readCsvRecords(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, "utf8");
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];
}

function lowerEmail(raw: string | undefined): string | null {
  const t = (raw ?? "").trim().toLowerCase();
  return t || null;
}

function normalizeProductTitle(s: string): string {
  return s
    .replace(/\u00a0/g, " ")
    .replace(/[—–−]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Strip WooCommerce price tail from exported line title. */
function baseLineTitle(csvLineName: string): string {
  const first = csvLineName.split(/\s[—–−]\s/)[0]?.trim() ?? csvLineName.trim();
  return normalizeProductTitle(first);
}

type SlimProduct = { id: string; name: string; norm: string };

function createMatcher(products: { id: string; name: string }[]) {
  const slim: SlimProduct[] = products
    .filter((p) => !p.name.startsWith("Imported line item"))
    .map((p) => ({ id: p.id, name: p.name, norm: normalizeProductTitle(p.name) }))
    .sort((a, b) => b.norm.length - a.norm.length);

  let placeholderId = "";

  async function initPlaceholder() {
    const ph = await prisma.product.upsert({
      where: { slug: "_woo_import_unmatched" },
      create: {
        slug: "_woo_import_unmatched",
        name: "Imported line item (unmatched)",
        shortDesc: "Historical migration placeholder",
        longDesc:
          "This product is used when a WooCommerce order line could not be matched to a Modempic catalog product by name.",
        priceCents: 0,
        status: ProductStatus.PUBLISHED,
      },
      update: {},
    });
    placeholderId = ph.id;
    return placeholderId;
  }

  function match(lineTitle: string): string {
    const nb = baseLineTitle(lineTitle);
    if (!nb) return placeholderId;
    for (const p of slim) {
      if (!p.norm) continue;
      if (nb === p.norm) return p.id;
      if (nb.startsWith(p.norm) || p.norm.startsWith(nb)) return p.id;
    }
    for (const p of slim) {
      if (!p.norm) continue;
      if (nb.includes(p.norm) || p.norm.includes(nb)) return p.id;
    }
    return placeholderId;
  }

  return { initPlaceholder, match, getPlaceholderId: () => placeholderId };
}

/** Build Woo numeric SKU → first seen line-item display name from order export columns. */
function collectSkuToLineName(orderRows: Record<string, string>[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const row of orderRows) {
    for (let i = 1; i <= 6; i++) {
      const name = (row[`Product Item ${i} Name`] ?? "").trim();
      const sku = (row[`Product Item ${i} SKU`] ?? "").trim();
      if (sku && name && !m.has(sku)) m.set(sku, name);
    }
  }
  return m;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseRating(raw: string | undefined): number {
  const n = parseInt(String(raw ?? "").trim(), 10);
  if (Number.isNaN(n)) return 5;
  return Math.min(5, Math.max(1, n));
}

async function main() {
  const { reviewsCsv, ordersCsv, apply } = args();

  if (!fs.existsSync(reviewsCsv)) {
    console.error(`Reviews CSV not found: ${reviewsCsv}`);
    process.exit(1);
  }
  if (!fs.existsSync(ordersCsv)) {
    console.error(`Orders CSV not found (needed for SKU → product title map): ${ordersCsv}`);
    process.exit(1);
  }

  const reviewRows = readCsvRecords(reviewsCsv);
  const orderRows = readCsvRecords(ordersCsv);
  const skuToName = collectSkuToLineName(orderRows);

  const catalog = await prisma.product.findMany({ select: { id: true, name: true } });
  const matcher = createMatcher(catalog);
  await matcher.initPlaceholder();
  const placeholderId = matcher.getPlaceholderId();

  let wouldImport = 0;
  let skipped = 0;
  const skipReasons: Record<string, number> = {};

  function bump(reason: string) {
    skipped++;
    skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
  }

  type RowPlan = {
    importKey: string;
    wooId: string;
    productId: string;
    email: string;
    name: string;
    rating: number;
    title: string | null;
    body: string;
    createdAt: Date;
  };

  const plans: RowPlan[] = [];

  for (const row of reviewRows) {
    const wooId = String(row.id ?? "").trim();
    const importKey = `woo-review-${wooId}`;
    const parent = String(row.parent ?? "").trim();
    if (parent) {
      bump("reply_or_child_review");
      continue;
    }

    const sku = String(row.product_sku ?? "").trim();
    const productIdWoo = String(row.product_id ?? "").trim();
    if (!sku || productIdWoo === "-1") {
      bump("no_product_sku_or_invalid_product");
      continue;
    }

    const bodyRaw = String(row.review_content ?? "").trim();
    if (!bodyRaw) {
      bump("empty_body");
      continue;
    }

    const email = lowerEmail(row.email);
    if (!email) {
      bump("no_email");
      continue;
    }

    const lineName = skuToName.get(sku);
    if (!lineName) {
      console.warn(`Woo review ${wooId}: unknown SKU ${sku} — not found in orders CSV; add to order export or extend script.`);
      bump("unknown_sku");
      continue;
    }

    const productId = matcher.match(lineName);
    if (!productId || productId === placeholderId) {
      console.warn(`Woo review ${wooId}: could not match product for SKU ${sku} ("${baseLineTitle(lineName)}")`);
      bump("unmatched_product");
      continue;
    }

    const titleRaw = String(row.review_title ?? "").trim();
    const createdAt = new Date(String(row.date ?? ""));
    if (Number.isNaN(createdAt.getTime())) {
      bump("bad_date");
      continue;
    }

    plans.push({
      importKey,
      wooId,
      productId,
      email,
      name: String(row.display_name ?? "").trim() || email.split("@")[0]!,
      rating: parseRating(row.review_score),
      title: titleRaw || null,
      body: stripHtml(bodyRaw),
      createdAt,
    });
  }

  wouldImport = plans.length;
  console.log(`Reviews CSV: ${reviewsCsv} (${reviewRows.length} rows)`);
  console.log(`Orders CSV: ${ordersCsv} (${orderRows.length} rows, ${skuToName.size} unique SKUs)`);
  console.log(`Planned new reviews: ${wouldImport}, skipped: ${skipped}`);
  if (skipped > 0) console.log("Skip breakdown:", skipReasons);

  if (!apply) {
    console.log("\nDry-run. Re-run with --apply to write reviews.");
    await prisma.$disconnect();
    return;
  }

  let created = 0;
  let already = 0;
  let errors = 0;

  for (const p of plans) {
    try {
      const existing = await prisma.review.findUnique({
        where: { importKey: p.importKey },
        select: { id: true },
      });
      if (existing) {
        already++;
        continue;
      }

      const user = await prisma.user.upsert({
        where: { email: p.email },
        create: {
          email: p.email,
          name: p.name,
          role: Role.CUSTOMER,
          emailVerified: new Date(),
        },
        update: { name: p.name },
      });

      await prisma.review.create({
        data: {
          importKey: p.importKey,
          productId: p.productId,
          userId: user.id,
          rating: p.rating,
          title: p.title,
          body: p.body,
          status: ReviewStatus.APPROVED,
          createdAt: p.createdAt,
        },
      });
      created++;
    } catch (e) {
      errors++;
      console.warn(`Review woo id ${p.wooId}:`, e instanceof Error ? e.message : e);
    }
  }

  console.log(`\nDone. created=${created} already_present=${already} errors=${errors}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
