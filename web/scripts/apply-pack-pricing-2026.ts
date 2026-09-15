/**
 * Apply 30/60/90 pack sizes and selling prices from Product Pricing NEW 2026
 * (Google Sheet column I). Combos use column W.
 *
 * From web/: npx tsx scripts/apply-pack-pricing-2026.ts
 */
import fs from "node:fs";
import path from "node:path";
import { Prisma, PrismaClient, ProductStatus } from "@prisma/client";
import { allocatePaymentCode } from "../src/lib/catalog/payment-code";
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

const LYRICA_SLUG = "buy-lyrica-pregabalin-nervigesic-300-mg";

/** Selling prices in USD for 30 / 60 / 90 pill packs (sheet column I). */
const STANDARD_PACKS: Record<string, { 30: number; 60: number; 90: number }> = {
  "buy-artvigil-150-mg": { 30: 50, 60: 80, 90: 110 },
  "buy-waklert-150-mg": { 30: 59, 60: 99, 90: 129 },
  "buy-modalert-200-mg": { 30: 59, 60: 99, 90: 129 },
  "buy-modvigil-200-mg": { 30: 49, 60: 79, 90: 99 },
  "buy-vilafinil-200-mg": { 30: 50, 60: 80, 90: 110 },
  "buy-modawake-200-mg": { 30: 49, 60: 79, 90: 99 },
  "buy-modaheal-200-mg": { 30: 49, 60: 79, 90: 99 },
  "buy-artvigil-250-mg": { 30: 55, 60: 85, 90: 115 },
  "buy-armodaxl-150-mg": { 30: 50, 60: 80, 90: 110 },
  "buy-modaxl-300-mg": { 30: 55, 60: 85, 90: 115 },
  "buy-armodaxl-250-mg": { 30: 55, 60: 85, 90: 115 },
  "buy-modactive-200-mg": { 30: 49, 60: 79, 90: 99 },
  "buy-modafil-md-200-mg": { 30: 50, 60: 80, 90: 110 },
  "buy-modavinil-200-mg": { 30: 49, 60: 79, 90: 99 },
  "buy-modasmart-400-mg": { 30: 59, 60: 89, 90: 129 },
  [LYRICA_SLUG]: { 30: 105, 60: 195, 90: 255 },
};

const COMBO_TIERS: Record<string, VariantTier[]> = {
  "starter-pack-combo": [
    { label: "10 pills of each", priceCents: 5900 },
    { label: "20 pills of each", priceCents: 8900 },
  ],
  "upsize-combo": [{ label: "30 pills of each", priceCents: 10900 }],
};

function usdTiers(prices: { 30: number; 60: number; 90: number }): VariantTier[] {
  return [
    { label: "30 pills", priceCents: prices[30] * 100 },
    { label: "60 pills", priceCents: prices[60] * 100 },
    { label: "90 pills", priceCents: prices[90] * 100 },
  ];
}

function seoDescWithNewPackPrices(
  seoDesc: string | null,
  prices: { 30: number; 60: number; 90: number },
): string | undefined {
  if (!seoDesc) return undefined;
  // Use a replacer function so `$110` is not read as `$1` + `10`.
  const next = seoDesc.replace(/at \$(\d+), \$(\d+), or \$(\d+)/g, () => {
    return `at $${prices[30]}, $${prices[60]}, or $${prices[90]}`;
  });
  return next === seoDesc ? undefined : next;
}

async function ensureLyricaProduct() {
  const existing = await prisma.product.findUnique({ where: { slug: LYRICA_SLUG }, select: { id: true } });
  if (existing) return;

  const prices = STANDARD_PACKS[LYRICA_SLUG];
  const tiers = usdTiers(prices);
  const priceCents = Math.min(...tiers.map((t) => t.priceCents));
  const category = await prisma.category.upsert({
    where: { slug: "anti-epileptic" },
    update: {},
    create: { slug: "anti-epileptic", name: "Anti-Epileptic" },
  });

  await prisma.$transaction(async (tx) => {
    const paymentCode = await allocatePaymentCode(tx);
    const row = await tx.product.create({
      data: {
        slug: LYRICA_SLUG,
        paymentCode,
        name: "Lyrica (Pregabalin Nervigesic) 300 mg",
        shortDesc:
          "Lyrica (Pregabalin Nervigesic) 300 mg in 30, 60, or 90 capsule packs. Live USD checkout. Import rules vary by jurisdiction.",
        longDesc:
          "Lyrica (Pregabalin Nervigesic) 300 mg is listed here as Nervigesic capsules. Choose a 30, 60, or 90 pack. This is catalog copy, not medical advice. Pregabalin is a prescription medicine in many countries, and legal status and import rules vary by jurisdiction.",
        variants: tiers as unknown as Prisma.InputJsonValue,
        priceCents,
        compareAtCents: null,
        status: ProductStatus.PUBLISHED,
        activeIngredient: "Pregabalin",
        strengthMg: 300,
        seoTitle: "Lyrica (Pregabalin Nervigesic) 300 mg",
        seoDesc:
          "Lyrica (Pregabalin Nervigesic) 300 mg is listed as Nervigesic capsules in 30, 60, or 90 packs at $105, $195, or $255. Live USD prices, card or crypto checkout. Import rules vary.",
        disclaimer:
          "This listing is a catalog product page, not medical advice. Pregabalin is a prescription medicine in many countries and legal status varies by jurisdiction. Check local rules before you import.",
      },
    });
    await tx.productCategory.create({ data: { productId: row.id, categoryId: category.id } });
    await syncProductVariants(tx, {
      productId: row.id,
      productSlug: row.slug,
      productName: row.name,
      priceCents,
      compareAtCents: null,
      tiers,
    });
    console.log(`created ${LYRICA_SLUG}`);
  });
}

async function main() {
  await ensureLyricaProduct();

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, status: true, seoDesc: true },
  });

  const unmatched: string[] = [];
  let updated = 0;

  for (const product of products) {
    if (SKIP_SLUGS.has(product.slug) || product.status === ProductStatus.DRAFT) continue;

    const standard = STANDARD_PACKS[product.slug];
    const tiers = COMBO_TIERS[product.slug] ? COMBO_TIERS[product.slug] : standard ? usdTiers(standard) : null;

    if (!tiers) {
      unmatched.push(`${product.slug} (${product.name})`);
      continue;
    }

    const priceCents = Math.min(...tiers.map((t) => t.priceCents));
    const seoDesc = standard ? seoDescWithNewPackPrices(product.seoDesc, standard) : undefined;

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: {
          variants: tiers as unknown as Prisma.InputJsonValue,
          priceCents,
          compareAtCents: null,
          ...(seoDesc ? { seoDesc } : {}),
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
