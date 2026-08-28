/**
 * Apply 30/50/100 pack sizes and selling prices from Product Pricing NEW.xlsx
 * (Modafinil 2026 sheet). Combos keep their own pack shapes.
 *
 * From web/: npx tsx scripts/apply-pack-pricing-2026.ts
 */
import fs from "node:fs";
import path from "node:path";
import { Prisma, PrismaClient, ProductStatus } from "@prisma/client";
import { syncProductVariants } from "../src/lib/catalog/product-variant-store";
import type { VariantTier } from "../src/lib/product-variants";

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
const prisma = new PrismaClient();

const SKIP_SLUGS = new Set(["_woo_import_unmatched"]);

/** Selling prices in USD for 30 / 50 / 100 pill packs (sheet column I). */
const STANDARD_PACKS: Record<string, { 30: number; 50: number; 100: number }> = {
  "buy-artvigil-150-mg": { 30: 50, 50: 70, 100: 120 },
  "buy-waklert-150-mg": { 30: 59, 50: 79, 100: 139 },
  "buy-modalert-200-mg": { 30: 59, 50: 89, 100: 149 },
  "buy-modvigil-200-mg": { 30: 49, 50: 69, 100: 109 },
  "buy-vilafinil-200-mg": { 30: 50, 50: 70, 100: 120 },
  "buy-modawake-200-mg": { 30: 49, 50: 69, 100: 109 },
  "buy-modaheal-200-mg": { 30: 49, 50: 69, 100: 109 },
  "buy-artvigil-250-mg": { 30: 55, 50: 85, 100: 125 },
  "buy-armodaxl-150-mg": { 30: 50, 50: 70, 100: 120 },
  "buy-modaxl-300-mg": { 30: 55, 50: 85, 100: 125 },
  "buy-armodaxl-250-mg": { 30: 55, 50: 85, 100: 125 },
  "buy-modactive-200-mg": { 30: 49, 50: 69, 100: 109 },
  "buy-modafil-md-200-mg": { 30: 50, 50: 70, 100: 120 },
  "buy-modavinil-200-mg": { 30: 49, 50: 69, 100: 109 },
  "buy-modasmart-400-mg": { 30: 59, 50: 79, 100: 139 },
};

const COMBO_TIERS: Record<string, VariantTier[]> = {
  "starter-pack-combo": [
    { label: "10 pills of each", priceCents: 3900 },
    { label: "30 pills of each", priceCents: 6900 },
  ],
  "upsize-combo": [{ label: "50 pills of each", priceCents: 9900 }],
};

function usdTiers(prices: { 30: number; 50: number; 100: number }): VariantTier[] {
  return [
    { label: "30 pills", priceCents: prices[30] * 100 },
    { label: "50 pills", priceCents: prices[50] * 100 },
    { label: "100 pills", priceCents: prices[100] * 100 },
  ];
}

async function main() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, status: true },
  });

  const unmatched: string[] = [];
  let updated = 0;

  for (const product of products) {
    if (SKIP_SLUGS.has(product.slug) || product.status === ProductStatus.DRAFT) continue;

    const tiers = COMBO_TIERS[product.slug]
      ? COMBO_TIERS[product.slug]
      : STANDARD_PACKS[product.slug]
        ? usdTiers(STANDARD_PACKS[product.slug])
        : null;

    if (!tiers) {
      unmatched.push(`${product.slug} (${product.name})`);
      continue;
    }

    const priceCents = Math.min(...tiers.map((t) => t.priceCents));

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: {
          variants: tiers as unknown as Prisma.InputJsonValue,
          priceCents,
          compareAtCents: null,
        },
      });
      await syncProductVariants(tx, {
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        priceCents,
        compareAtCents: null,
        tiers,
      });
    });

    updated += 1;
    console.log(
      `${product.slug}\t${tiers.map((t) => `${t.label}=$${(t.priceCents / 100).toFixed(0)}`).join(" | ")}`,
    );
  }

  if (unmatched.length) {
    throw new Error(`No pricing map for: ${unmatched.join(", ")}`);
  }

  console.log(`updated ${updated} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
